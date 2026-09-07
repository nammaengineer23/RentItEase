import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { RegisterDto } from './register.dto';

export class VerifiedRegisterDto extends RegisterDto {
  @ApiPropertyOptional({
    description: 'Short-lived proof returned after email OTP verification',
  })
  @IsString()
  @IsNotEmpty()
  emailVerificationToken!: string;

  @ApiProperty({
    description: 'Firebase ID token containing the verified phone number',
  })
  @IsString()
  @IsOptional()
  phoneIdToken?: string;
}
