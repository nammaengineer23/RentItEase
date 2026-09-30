import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FirebaseService } from '../../firebase/firebase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { OtpService } from '../../common/otp/otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { VerifiedRegisterDto } from './dto/verified-register.dto';
import { AuthRateLimitService } from '../../common/auth/auth-rate-limit.service';
import { JwtSecretService } from '../../common/auth/jwt-secret.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
    @Optional() private readonly authRateLimitService: AuthRateLimitService,
    @Optional() private readonly jwtSecretService: JwtSecretService,
  ) {}

  private readonly signupEmailPurpose = 'SIGNUP_EMAIL';
  private readonly loginEmailPurpose = 'LOGIN_EMAIL';

  async requestSignupEmailOtp(dto: RequestEmailOtpDto, ip?: string) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (!existing) {
      await this.createEmailOtpChallenge(email, this.signupEmailPurpose, ip);
    }

    return {
      success: true,
      message: 'Verification code sent to your email.',
    };
  }

  async verifySignupEmailOtp(dto: VerifyEmailOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const challengeId = await this.consumeEmailOtpChallenge(
      email,
      this.signupEmailPurpose,
      dto.otp,
    );

    const verificationToken = await this.jwtService.signAsync(
      { type: this.signupEmailPurpose, email, challengeId },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '10m',
      },
    );

    return {
      success: true,
      message: 'Email verified.',
      verificationToken,
    };
  }

  async registerVerified(dto: VerifiedRegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const proof = await this.jwtService.verifyAsync<{
      type: string;
      email: string;
      challengeId: string;
    }>(dto.emailVerificationToken, {
      secret: process.env.JWT_ACCESS_SECRET,
    });

    if (
      proof.type !== this.signupEmailPurpose ||
      proof.email !== email ||
      !proof.challengeId
    ) {
      throw new UnauthorizedException('Invalid email verification proof.');
    }

    const verificationClaim = await this.prisma.authOtpChallenge.updateMany({
      where: {
        id: proof.challengeId,
        target: email,
        purpose: this.signupEmailPurpose,
        consumedAt: { not: null },
        proofUsedAt: null,
      },
      data: { proofUsedAt: new Date() },
    });

    if (verificationClaim.count !== 1) {
      throw new UnauthorizedException(
        'Email verification proof is invalid or has already been used.',
      );
    }

    const phone = dto.phone ? this.normalizePhone(dto.phone) : null;
    if (phone != null) {
      if (!dto.phoneIdToken) {
        throw new UnauthorizedException(
          'Verify the mobile number before registering it.',
        );
      }
      const decodedPhone = await this.firebaseService.verifyToken(
        dto.phoneIdToken,
      );
      const verifiedPhone = decodedPhone.phone_number;
      if (
        !verifiedPhone ||
        this.normalizePhone(verifiedPhone) !== this.normalizePhone(phone)
      ) {
        throw new UnauthorizedException(
          'Verified phone number does not match registration phone.',
        );
      }
      const phoneOwner = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (phoneOwner) {
        throw new ConflictException(
          'This mobile number is already registered. Please sign in or use a different number.',
        );
      }
    }

    return this.register({
      fullName: dto.fullName,
      email,
      phone: phone ?? undefined,
      password: dto.password,
    });
  }

  async requestLoginEmailOtp(dto: RequestEmailOtpDto, ip?: string) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user?.isActive) {
      await this.createEmailOtpChallenge(email, this.loginEmailPurpose, ip);
    }

    return {
      success: true,
      message: 'If the account exists, a login code has been sent.',
    };
  }

  async loginWithEmailOtp(dto: VerifyEmailOtpDto, ip?: string) {
    if (ip) await this.authRateLimitService.assertAllowed('otp-verify-ip', ip, 10);
    await this.authRateLimitService.assertAllowed('otp-verify-target', dto.email.trim().toLowerCase(), 5);
    const email = dto.email.trim().toLowerCase();
    try {
      await this.consumeEmailOtpChallenge(email, this.loginEmailPurpose, dto.otp);
    } catch (error) {
      if (ip) await this.authRateLimitService.recordFailure('otp-verify-ip', ip, 10);
      await this.authRateLimitService.recordFailure('otp-verify-target', email, 5);
      throw error;
    }

    if (ip) await this.authRateLimitService.clear('otp-verify-ip', ip);
    await this.authRateLimitService.clear('otp-verify-target', email);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or inactive account.');
    }

    return this.createSession(user);
  }

  async loginWithPhoneOtp(idToken: string, ip?: string) {
    if (ip) await this.authRateLimitService.assertAllowed('firebase-login-ip', ip, 10);
    const decoded = await this.firebaseService.verifyToken(idToken);
    const phone = decoded.phone_number;

    if (!phone) {
      throw new UnauthorizedException(
        'Verified phone number not found in Firebase token.',
      );
    }

    const normalized = this.normalizePhone(phone);
    const user = await this.prisma.user.findUnique({
      where: { phone: normalized },
    });

    if (!user || !user.isActive) {
      if (ip) await this.authRateLimitService.recordFailure('firebase-login-ip', ip, 10);
      throw new UnauthorizedException('Invalid or inactive account.');
    }

    if (ip) await this.authRateLimitService.clear('firebase-login-ip', ip);
    return this.createSession(user);
  }

  private async createEmailOtpChallenge(
    target: string,
    purpose: string,
    ip?: string,
  ) {
    const now = new Date();

    // Remove terminal challenges before creating/updating the single active
    // challenge for this target and purpose.
    await this.prisma.authOtpChallenge.deleteMany({
      where: {
        target,
        purpose,
        OR: [
          { expiresAt: { lte: now } },
          { consumedAt: { not: null } },
        ],
      },
    });

    const existing = await this.prisma.authOtpChallenge.findUnique({
      where: { target_purpose: { target, purpose } },
    });

    if (existing?.lastSentAt && now.getTime() - existing.lastSentAt.getTime() < 30_000) {
      throw new HttpException('Please wait before requesting another verification code.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const windowActive =
      existing?.windowStartedAt &&
      now.getTime() - existing.windowStartedAt.getTime() < 15 * 60 * 1000;
    const requestCount = windowActive ? existing?.requestCount ?? 0 : 0;

    if (requestCount >= 5) {
      throw new HttpException('Too many verification code requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const otp = this.otpService.generateOtp();
    const otpHash = await this.otpService.hashOtp(otp);

    if (existing) {
      const claimed = await this.prisma.authOtpChallenge.updateMany({
        where: {
          id: existing.id,
          lastSentAt: existing.lastSentAt,
          requestCount: existing.requestCount,
        },
        data: {
          otpHash,
          attempts: 0,
          expiresAt: this.otpService.getExpiryDate(),
          consumedAt: null,
          lastSentAt: now,
          windowStartedAt: windowActive ? existing.windowStartedAt : now,
          requestCount: requestCount + 1,
        },
      });
      if (claimed.count !== 1) {
        throw new HttpException('Please wait before requesting another verification code.', HttpStatus.TOO_MANY_REQUESTS);
      }
    } else {
      try {
        await this.prisma.authOtpChallenge.create({
          data: {
            target,
            purpose,
            otpHash,
            expiresAt: this.otpService.getExpiryDate(),
            lastSentAt: now,
            windowStartedAt: now,
            requestCount: 1,
          },
        });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new HttpException('Please wait before requesting another verification code.', HttpStatus.TOO_MANY_REQUESTS);
        }
        throw error;
      }
    }

    void ip;
    await this.mailService.sendAuthenticationOtp(target, otp);
  }

  private async consumeEmailOtpChallenge(
    target: string,
    purpose: string,
    otp: string,
  ): Promise<string> {
    const challenge = await this.prisma.authOtpChallenge.findUnique({
      where: { target_purpose: { target, purpose } },
    });

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt < new Date() ||
      challenge.attempts >= 5
    ) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    const matches = await this.otpService.verifyOtp(otp, challenge.otpHash);
    if (!matches) {
      const claimed = await this.prisma.authOtpChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
      });
      if (claimed.count !== 1) {
        throw new UnauthorizedException('Invalid or expired verification code.');
      }
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    const consumed = await this.prisma.authOtpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        attempts: { lt: 5 },
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });

    if (consumed.count !== 1) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    return challenge.id;
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
      return '+91' + digits;
    }
    if (
      digits.length === 12 &&
      digits.startsWith('91') &&
      /^[6-9]\d{9}$/.test(digits.slice(2))
    ) {
      return '+' + digits;
    }
    throw new UnauthorizedException('Invalid Indian mobile number.');
  }

  private async createSession(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    photoUrl: string | null;
  }) {
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photoUrl: user.photoUrl,
      },
      ...tokens,
    };
  }

  // ==========================================
  // Register
  // ==========================================
  async register(dto: RegisterDto) {
    if (dto.phone) {
      throw new UnauthorizedException(
        'Phone verification is required before registering a mobile number.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email,
        phone: dto.phone,
        passwordHash: hashedPassword,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Account creation must not wait for the external SMTP server. A slow or
    // unavailable mail provider previously caused the mobile request to hit
    // its 30-second timeout even though the user had already been created.
    void this.mailService
      .sendWelcomeEmail(user.email, user.fullName)
      .catch((error: unknown) => {
        this.logger.error(
          'Failed to send welcome email',
          error instanceof Error ? error.stack : undefined,
        );
      });

    return {
      success: true,
      message: 'Registration successful.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ==========================================
  // Login
  // ==========================================
  async login(dto: LoginDto, ip?: string) {
    const login = dto.login.trim();
    const normalizedEmail = login.toLowerCase();
    const normalizedPhone = /^\+?\d[\d\s().-]{8,}$/.test(login)
      ? this.normalizePhone(login)
      : null;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
    });

    if (!user) {
      if (ip) await this.authRateLimitService.recordFailure('password-login-ip', ip, 10);
      await this.authRateLimitService.recordFailure('password-login-account', normalizedEmail, 5);
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash);

    if (!matched) {
      if (ip) await this.authRateLimitService.recordFailure('password-login-ip', ip, 10);
      await this.authRateLimitService.recordFailure('password-login-account', normalizedEmail, 5);
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (ip) await this.authRateLimitService.clear('password-login-ip', ip);
    await this.authRateLimitService.clear('password-login-account', normalizedEmail);

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }
  // ==========================================
  // Firebase Login
  // ==========================================
  async firebaseLogin(
    idToken: string,
    createAccount = false,
    phoneIdToken?: string,
  ) {
    const decoded = await this.firebaseService.verifyToken(idToken);
    const firebaseUid = decoded.uid;

    if (!firebaseUid) {
      throw new UnauthorizedException('Invalid Firebase identity.');
    }

    const phone = decoded.phone_number
      ? this.normalizePhone(decoded.phone_number)
      : null;
    const email = decoded.email?.trim().toLowerCase();

    if (!phone && !email) {
      throw new UnauthorizedException(
        'Phone number or verified email not found in Firebase token.',
      );
    }

    // Firebase UID is the durable identity binding. Phone/email are only
    // used to locate an existing unbound RentItEase account during migration.
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user && phone) {
      user = await this.prisma.user.findUnique({ where: { phone } });
    }

    if (!user && email && decoded.email_verified === true) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      if (!createAccount) {
        throw new UnauthorizedException(
          'No RentItEase account exists for this Firebase account.',
        );
      }

      if (!email || decoded.email_verified !== true) {
        throw new UnauthorizedException(
          'A verified Firebase email is required to create an account.',
        );
      }

      user = await this.prisma.user.create({
        data: {
          firebaseUid,
          fullName: decoded.name ?? 'RentItEase User',
          phone,
          email,
          passwordHash: '',
          photoUrl: decoded.picture,
        },
      });
    } else {
      // Never silently rebind an already-linked account to another Firebase UID.
      if (user.firebaseUid && user.firebaseUid !== firebaseUid) {
        throw new UnauthorizedException('Firebase identity mismatch.');
      }

      if (!user.firebaseUid) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid },
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photoUrl: user.photoUrl,
      },
      ...tokens,
    };
  }

  // ==========================================
  // Refresh Token
  // ==========================================
  async refreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      email: string;
      jti?: string;
      familyId?: string;
    }>(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    if (!payload.sub || !payload.jti || !payload.familyId) {
      throw new UnauthorizedException(
        'Invalid refresh token. Please sign in again.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, email: true },
    });

    if (!user || !user.isActive || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid or inactive account.');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.familyId !== payload.familyId
    ) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const matches = await bcrypt.compare(refreshToken, storedToken.token);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expired.');
    }

    if (storedToken.usedAt || storedToken.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, familyId: payload.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected. Please sign in again.',
      );
    }

    const tokens = await this.generateTokens(
      payload.sub,
      payload.email,
      payload.familyId as `${string}-${string}-${string}-${string}-${string}`,
    );

    const rotated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        return false;
      }

      const decoded = this.jwtService.decode(tokens.refreshToken) as {
        jti?: string;
        familyId?: string;
      } | null;

      if (!decoded?.jti || decoded.familyId !== payload.familyId) {
        throw new UnauthorizedException('Unable to rotate refresh token.');
      }

      const hashedToken = await bcrypt.hash(tokens.refreshToken, 12);
      await tx.refreshToken.create({
        data: {
          jti: decoded.jti,
          familyId: payload.familyId as `${string}-${string}-${string}-${string}-${string}`,
          token: hashedToken,
          userId: payload.sub,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return true;
    });

    if (!rotated) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, familyId: payload.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected. Please sign in again.',
      );
    }

    return {
      success: true,
      message: 'Token refreshed successfully.',
      ...tokens,
    };
  }

  // ==========================================
  // Logout
  // ==========================================
  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  // ==========================================
  // Save Refresh Token
  // ==========================================
  private async saveRefreshToken(userId: string, token: string) {
    const decoded = this.jwtService.decode(token) as {
      jti?: string;
      familyId?: string;
    } | null;

    if (!decoded?.jti || !decoded.familyId) {
      throw new UnauthorizedException(
        'Unable to establish refresh-token state.',
      );
    }

    const hashedToken = await bcrypt.hash(token, 12);

    await this.prisma.refreshToken.create({
      data: {
        jti: decoded.jti,
        familyId: decoded.familyId,
        token: hashedToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  //---------------------------------------
  // Validate User
  //---------------------------------------
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    familyId = crypto.randomUUID(),
  ) {
    const payload = {
      sub: userId,
      email,
      jti: crypto.randomUUID(),
      familyId,
    };

    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    // Always return the same response
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Delete previous reset tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Save token
    await this.prisma.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 60 * 60 * 1000, // 1 hour
        ),
      },
    });

    const resetBaseUrl =
      process.env.PASSWORD_RESET_URL ?? 'https://rentitease.com/reset-password';
    const separator = resetBaseUrl.includes('?') ? '&' : '?';
    const resetLink = `${resetBaseUrl}${separator}token=${encodeURIComponent(token)}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetLink,
    );

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        token: tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash: hashedPassword,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  }
  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        photoUrl: true,
        role: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    if (dto.phone != null) {
      const normalizedPhone = this.normalizePhone(dto.phone);
      const phoneOwner = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      if (phoneOwner != null && phoneOwner.id != userId) {
        throw new ConflictException(
          'This mobile number is already registered. Please sign in or use a different number.',
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName != null && { fullName: dto.fullName.trim() }),
        ...(dto.phone != null && { phone: this.normalizePhone(dto.phone) }),
        ...(dto.photoUrl != null && { photoUrl: dto.photoUrl }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        photoUrl: true,
        role: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const matched = await bcrypt.compare(dto.oldPassword, user.passwordHash);

    if (!matched) {
      throw new UnauthorizedException('Old password is incorrect.');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          passwordHash: hashed,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      success: true,
      message: 'Password changed successfully. Please sign in again.',
    };
  }
}
