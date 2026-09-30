import {
  Body,
  Ip,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
import { VerifiedRegisterDto } from './dto/verified-register.dto';
import { PhoneOtpLoginDto } from './dto/phone-otp-login.dto';
import { FirebaseAppCheckGuard } from '../../firebase/firebase-app-check.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000, blockDuration: 15 * 60 * 1000 } })
  @Post('register/email-otp/request')
  @ApiOperation({ summary: 'Send signup email verification OTP' })
  requestSignupEmailOtp(@Body() dto: RequestEmailOtpDto, @Ip() ip: string) {
    return this.authService.requestSignupEmailOtp(dto, ip);
  }

  @Post('register/email-otp/verify')
  @ApiOperation({ summary: 'Verify signup email OTP' })
  verifySignupEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifySignupEmailOtp(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000, blockDuration: 15 * 60 * 1000 } })
  @Post('login/email-otp/request')
  @ApiOperation({ summary: 'Send email login OTP' })
  requestLoginEmailOtp(@Body() dto: RequestEmailOtpDto, @Ip() ip: string) {
    return this.authService.requestLoginEmailOtp(dto, ip);
  }

  @Post('login/email-otp/verify')
  @ApiOperation({ summary: 'Login with email OTP' })
  loginWithEmailOtp(@Body() dto: VerifyEmailOtpDto, @Ip() ip: string) {
    return this.authService.loginWithEmailOtp(dto, ip);
  }

  @Throttle({ default: { limit: 8, ttl: 15 * 60 * 1000, blockDuration: 15 * 60 * 1000 } })
  @Post('login/phone-otp')
  @UseGuards(FirebaseAppCheckGuard)
  @ApiOperation({ summary: 'Login with Firebase phone OTP proof' })
  loginWithPhoneOtp(@Body() dto: PhoneOtpLoginDto, @Ip() ip: string) {
    return this.authService.loginWithPhoneOtp(dto.idToken, ip);
  }

  @Post('register/verified')
  @UseGuards(FirebaseAppCheckGuard)
  @ApiOperation({ summary: 'Create an account after email/phone verification' })
  registerVerified(@Body() dto: VerifiedRegisterDto) {
    return this.authService.registerVerified(dto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Create an account with email and password',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    return this.authService.login(loginDto, ip);
  }

  @Post('firebase-login')
  @UseGuards(FirebaseAppCheckGuard)
  @ApiOperation({
    summary: 'Login using Firebase Phone Authentication',
  })
  firebaseLogin(@Body() dto: FirebaseLoginDto) {
    return this.authService.firebaseLogin(
      dto.idToken,
      dto.createAccount ?? false,
      dto.phoneIdToken,
    );
  }

  @Post('refresh')
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
