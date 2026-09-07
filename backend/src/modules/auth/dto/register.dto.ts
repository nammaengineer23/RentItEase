import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'Namma Engineer',
  })
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    example: 'nammaengineer23@gmail.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '+918880002304',
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @ApiProperty({
    example: 'Password@123',
    minLength: 6,
  })
  @MinLength(6)
  password!: string;
}
