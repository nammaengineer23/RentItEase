import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { StorageService } from '../../storage/storage.service';
import { ImageFileValidator } from '../../common/validators/image-file.validator';
import { LoginDto } from './dto/login.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { PhoneOtpLoginDto } from './dto/phone-otp-login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  @Post('register/email-otp/request')
  @ApiOperation({ summary: 'Send signup email verification OTP' })
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  requestSignupEmailOtp(@Body() dto: RequestEmailOtpDto) {
    return this.authService.requestSignupEmailOtp(dto);
  }

  @Post('register/email-otp/verify')
  @ApiOperation({ summary: 'Verify signup email OTP' })
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  verifySignupEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifySignupEmailOtp(dto);
  }

  @Post('login/email-otp/request')
  @ApiOperation({ summary: 'Send email login OTP' })
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  requestLoginEmailOtp(@Body() dto: RequestEmailOtpDto) {
    return this.authService.requestLoginEmailOtp(dto);
  }

  @Post('login/email-otp/verify')
  @ApiOperation({ summary: 'Login with email OTP' })
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  loginWithEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.loginWithEmailOtp(dto);
  }

  @Post('login/phone-otp')
  @ApiOperation({ summary: 'Login with Firebase phone OTP proof' })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  loginWithPhoneOtp(@Body() dto: PhoneOtpLoginDto) {
    return this.authService.loginWithPhoneOtp(dto.idToken);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Create an account with email and password',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('firebase-login')
  @ApiOperation({
    summary:
      'Exchange a verified Firebase Google ID token for a RentItEase session',
    description:
      'Firebase verifies the Google identity. RentItEase resolves the Firebase UID to a PostgreSQL user and returns the existing RentItEase access and refresh tokens.',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  firebaseLogin(@Body() dto: FirebaseLoginDto) {
    return this.authService.firebaseLogin(
      dto.idToken,
      dto.createAccount ?? false,
    );
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Refresh Access Token',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // =====================================
  // Forgot Password
  // =====================================

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Send password reset email',
  })
  @Throttle({ default: { limit: 3, ttl: 900_000 } })
  forgotPassword(
    @Body()
    dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }

  // =====================================
  // Reset Password
  // =====================================

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
  })
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  resetPassword(
    @Body()
    dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
  })
  getCurrentUser(@Request() req: any) {
    return this.authService.me(req.user.id);
  }

  @Post('me/photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload or replace the authenticated user profile photo',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const extension = extname(file.originalname).toLowerCase();
        const allowed =
          allowedExtensions.includes(extension) &&
          allowedMimeTypes.includes(file.mimetype);

        callback(
          allowed
            ? null
            : new BadRequestException(
                'Only JPG, JPEG, PNG and WEBP images are allowed.',
              ),
          allowed,
        );
      },
    }),
  )
  async uploadCurrentUserPhoto(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const validator = new ImageFileValidator();
    if (!validator.isValid(file) || !(await validator.hasValidContent(file))) {
      throw new BadRequestException(validator.buildErrorMessage());
    }

    // The owner ID comes only from the verified JWT, never from client input.
    const uploaded = await this.storageService.uploadProfileImage(
      req.user.id,
      file,
    );

    let user;

    try {
      user = await this.authService.updateProfilePhoto(
        req.user.id,
        uploaded.publicId,
      );
    } catch (error) {
      // A failed database acknowledgement does not prove the write failed.
      // Read the current value before deleting the uploaded object.
      let shouldCleanup = false;

      try {
        const isStored = await this.authService.isProfilePhotoStored(
          req.user.id,
          uploaded.publicId,
        );
        shouldCleanup = !isStored;
      } catch (verificationError) {
        // Preserve the object if the read-back is inconclusive.
        console.error(
          'Could not verify profile image persistence; preserving uploaded object:',
          verificationError,
        );
      }

      if (shouldCleanup) {
        try {
          await this.storageService.deleteProfileImage(
            req.user.id,
            uploaded.publicId,
          );
        } catch (cleanupError) {
          console.error(
            'Failed to clean up an unpersisted profile image:',
            cleanupError,
          );
        }
      }

      throw error;
    }

    const photoUrl = await this.storageService.getProfileImageDownloadUrl(
      req.user.id,
      uploaded.publicId,
    );

    return {
      ...user,
      photoUrl,
      imageUrl: photoUrl,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the authenticated user profile',
  })
  updateCurrentUser(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
  })
  logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
  })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
