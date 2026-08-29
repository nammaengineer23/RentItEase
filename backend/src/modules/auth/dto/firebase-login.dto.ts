import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FirebaseLoginDto {
  @ApiProperty({
    description: 'Firebase ID Token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @IsBoolean()
  @IsOptional()
  createAccount?: boolean;

  @IsString()
  @IsOptional()
  phoneIdToken?: string;
}
