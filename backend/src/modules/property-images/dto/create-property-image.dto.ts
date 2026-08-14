import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyImageSection } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreatePropertyImageDto {
  @ApiProperty({
    example: '/uploads/abc123.jpg',
  })
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional({
    example: 'property-images/abc123',
  })
  @IsOptional()
  @IsString()
  publicId?: string;

  @ApiPropertyOptional({
    enum: PropertyImageSection,
    example: PropertyImageSection.KITCHEN,
  })
  @IsOptional()
  @IsEnum(PropertyImageSection)
  section?: PropertyImageSection;
}