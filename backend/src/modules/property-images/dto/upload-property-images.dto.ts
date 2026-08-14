import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PropertyImageSection } from '@prisma/client';

export class UploadPropertyImagesDto {
  @ApiProperty({
    type: [String],
    example: [
      'image1.jpg',
      'image2.jpg',
    ],
    description: 'Uploaded property image files',
  })
  @IsArray()
  @IsString({ each: true })
  imageUrls!: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Make the first uploaded image primary',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({
    enum: PropertyImageSection,
    example: PropertyImageSection.KITCHEN,
    description: 'Section of the property where these images belong',
  })
  @IsEnum(PropertyImageSection)
  section!: PropertyImageSection;
}