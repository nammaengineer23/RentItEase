import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PhoneOtpLoginDto {
  @ApiProperty({
    description: 'Firebase ID token containing the verified phone number',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
