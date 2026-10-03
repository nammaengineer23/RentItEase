import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
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
  constructor(private readonly authService: AuthService) {}

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
    summary: 'Login using Firebase Phone Authentication',
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
