import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Namma Engineer',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({
    example: '+918880002304',
  })
  @IsOptional()
  @IsString()
  @IsPhoneNumber('IN')
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/RentItEase/image/upload/profile.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  photoUrl?: string;
}
