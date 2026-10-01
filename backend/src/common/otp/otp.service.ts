import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  /**
   * Generate a random 6-digit OTP
   */
  generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
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
   * OTP expires after 5 minutes
   */
  getExpiryDate(): Date {
    return new Date(
      Date.now() + 5 * 60 * 1000,
    );
  }
}