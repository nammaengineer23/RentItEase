import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { RegisterDto } from './register.dto';

export class VerifiedRegisterDto extends RegisterDto {
  @ApiProperty({
    description: 'Short-lived proof returned after email OTP verification',
  })
  @IsString()
  @IsNotEmpty()
  emailVerificationToken!: string;

  @ApiProperty({
    description: 'Firebase ID token containing the verified phone number',
  })
  @IsString()
  @IsNotEmpty()
  phoneIdToken!: string;
}
