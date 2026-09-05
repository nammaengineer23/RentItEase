import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  NotFoundException,
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
  ) {}

  private readonly signupEmailPurpose = 'SIGNUP_EMAIL';
  private readonly loginEmailPurpose = 'LOGIN_EMAIL';

  async requestSignupEmailOtp(dto: RequestEmailOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('Email already exists.');
    }

    await this.createEmailOtpChallenge(email, this.signupEmailPurpose);

    return {
      success: true,
      message: 'Verification code sent to your email.',
    };
  }

  async verifySignupEmailOtp(dto: VerifyEmailOtpDto) {
    const email = dto.email.trim().toLowerCase();
    await this.consumeEmailOtpChallenge(
      email,
      this.signupEmailPurpose,
      dto.otp,
    );

    const verificationToken = await this.jwtService.signAsync(
      { type: this.signupEmailPurpose, email },
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
    }>(dto.emailVerificationToken, {
      secret: process.env.JWT_ACCESS_SECRET,
    });

    if (proof.type !== this.signupEmailPurpose || proof.email !== email) {
      throw new UnauthorizedException('Invalid email verification proof.');
    }

    const decodedPhone = await this.firebaseService.verifyToken(
      dto.phoneIdToken,
    );
    const verifiedPhone = decodedPhone.phone_number;

    if (!verifiedPhone) {
      throw new UnauthorizedException(
        'Verified phone number not found in Firebase token.',
      );
    }

    if (this.normalizePhone(verifiedPhone) !== this.normalizePhone(dto.phone)) {
      throw new UnauthorizedException(
        'Verified phone number does not match registration phone.',
      );
    }

    const phoneOwner = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (phoneOwner) {
      throw new ConflictException(
        'This mobile number is already registered. Please sign in or use a different number.',
      );
    }

    return this.register({
      fullName: dto.fullName,
      email,
      phone: dto.phone,
      password: dto.password,
    });
  }

  async requestLoginEmailOtp(dto: RequestEmailOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user?.isActive) {
      await this.createEmailOtpChallenge(email, this.loginEmailPurpose);
    }

    return {
      success: true,
      message: 'If the account exists, a login code has been sent.',
    };
  }

  async loginWithEmailOtp(dto: VerifyEmailOtpDto) {
    const email = dto.email.trim().toLowerCase();
    await this.consumeEmailOtpChallenge(email, this.loginEmailPurpose, dto.otp);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or inactive account.');
    }

    return this.createSession(user);
  }

  async loginWithPhoneOtp(idToken: string) {
    const decoded = await this.firebaseService.verifyToken(idToken);
    const phone = decoded.phone_number;

    if (!phone) {
      throw new UnauthorizedException(
        'Verified phone number not found in Firebase token.',
      );
    }

    const normalized = this.normalizePhone(phone);
    const digits = normalized.replace(/\D/g, '');
    const user = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        phone: {
          in: [normalized, digits, digits.substring(digits.length - 10)],
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('No account exists for this phone.');
    }

    return this.createSession(user);
  }

  private async createEmailOtpChallenge(target: string, purpose: string) {
    const otp = this.otpService.generateOtp();
    const otpHash = await this.otpService.hashOtp(otp);

    await this.prisma.authOtpChallenge.deleteMany({
      where: { target, purpose },
    });
    await this.prisma.authOtpChallenge.create({
      data: {
        target,
        purpose,
        otpHash,
        expiresAt: this.otpService.getExpiryDate(),
      },
    });

    await this.mailService.sendAuthenticationOtp(target, otp);
  }

  private async consumeEmailOtpChallenge(
    target: string,
    purpose: string,
    otp: string,
  ) {
    const challenge = await this.prisma.authOtpChallenge.findFirst({
      where: { target, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !challenge ||
      challenge.expiresAt < new Date() ||
      challenge.attempts >= 5
    ) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    const matches = await this.otpService.verifyOtp(otp, challenge.otpHash);
    if (!matches) {
      await this.prisma.authOtpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    await this.prisma.authOtpChallenge.delete({
      where: { id: challenge.id },
    });
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return phone.startsWith('+') ? phone : `+${digits}`;
  }

  private async createSession(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
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
    const existing = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existing) {
      throw new ConflictException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash: hashedPassword,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    try {
      await this.mailService.sendWelcomeEmail(user.email, user.fullName);
    } catch (error) {
      this.logger.error(
        'Failed to send welcome email',
        error instanceof Error ? error.stack : undefined,
      );
    }

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
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email: dto.login,
          },
          {
            phone: dto.login,
          },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash);

    if (!matched) {
      throw new UnauthorizedException('Invalid email or password.');
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

    const phone = decoded.phone_number?.trim();
    const email = decoded.email?.trim().toLowerCase();

    if (!phone && !email) {
      throw new UnauthorizedException(
        'Phone number or verified email not found in Firebase token.',
      );
    }

    let user = phone
      ? await this.prisma.user.findUnique({ where: { phone } })
      : null;

    if (!user && email) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      if (!createAccount) {
        throw new UnauthorizedException(
          'No RentItEase account exists for this Google account. Complete phone verification to create one.',
        );
      }

      if (!email || decoded.email_verified !== true) {
        throw new UnauthorizedException(
          'A verified Google email is required to create an account.',
        );
      }

      if (!phoneIdToken) {
        throw new UnauthorizedException(
          'Phone verification is required to create an account.',
        );
      }

      const decodedPhone = await this.firebaseService.verifyToken(phoneIdToken);
      const verifiedPhone = decodedPhone.phone_number?.trim();
      if (!verifiedPhone) {
        throw new UnauthorizedException(
          'Verified phone number not found in Firebase token.',
        );
      }

      const phoneOwner = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: verifiedPhone },
            { phone: this.normalizePhone(verifiedPhone) },
          ],
        },
      });
      if (phoneOwner) {
        throw new ConflictException(
          'This mobile number is already registered. Please sign in or use a different number.',
        );
      }

      user = await this.prisma.user.create({
        data: {
          fullName: decoded.name ?? 'RentItEase User',
          phone: this.normalizePhone(verifiedPhone),
          email,
          passwordHash: '',
          photoUrl: decoded.picture,
        },
      });
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
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
      },
    });

    let matchedToken: (typeof storedTokens)[number] | null = null;

    for (const token of storedTokens) {
      const matched = await bcrypt.compare(refreshToken, token.token);

      if (matched) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (matchedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: {
          id: matchedToken.id,
        },
      });

      throw new UnauthorizedException('Refresh token expired.');
    }

    await this.prisma.refreshToken.delete({
      where: {
        id: matchedToken.id,
      },
    });

    const tokens = await this.generateTokens(payload.sub, payload.email);

    await this.saveRefreshToken(payload.sub, tokens.refreshToken);

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
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
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
    const hashedToken = await bcrypt.hash(token, 10);

    await this.prisma.refreshToken.create({
      data: {
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

  private async generateTokens(userId: string, email: string) {
    const payload = {
      sub: userId,
      email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

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
      where: {
        email: dto.email,
      },
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

    // Save token
    await this.prisma.passwordResetToken.create({
      data: {
        token,
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
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        token: dto.token,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        passwordHash: hashedPassword,
      },
    });

    await this.prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    });

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
      const phoneOwner = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
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
        ...(dto.phone != null && { phone: dto.phone }),
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

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash: hashed,
      },
    });

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }
}
