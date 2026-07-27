import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  /**
   * Generate a random 6-digit OTP
   */
  generateOtp(): string {
    return Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
  }

  /**
   * Hash OTP before storing
   */
  async hashOtp(
    otp: string,
  ): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  /**
   * Verify OTP
   */
  async verifyOtp(
    otp: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  /**
   * OTP expires after 10 minutes
   */
  getExpiryDate(): Date {
    return new Date(
      Date.now() + 10 * 60 * 1000,
    );
  }
}