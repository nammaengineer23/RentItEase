import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
  ValidateIf,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import {
  FurnishingType,
  PropertyType,
} from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({
    example: '',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'Spacious apartment with modern amenities.',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    example: 25000,
  })
  @IsNumber()
  price!: number;

  @ApiProperty({
    example: '123 MG Road',
  })
  @IsString()
  address!: string;

  @ApiProperty({
    required: false,
    example: 'HSR Layout',
  })
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiProperty({
    required: false,
    example: 'Near BDA Complex',
  })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({
    example: 'Bangalore',
  })
  @IsString()
  city!: string;

  @ApiProperty({
    example: 'Karnataka',
  })
  @IsString()
  state!: string;

  @ApiProperty({
    example: 'India',
  })
  @IsString()
  country!: string;

  @ApiProperty({
    example: '560102',
  })
  @IsString()
  pincode!: string;

  @ApiProperty({
    required: false,
    example: 12.9116,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    required: false,
    example: 77.6474,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: 2,
  })
  @IsNumber()
  bedrooms!: number;

  @ApiProperty({
    example: 2,
  })
  @IsNumber()
  bathrooms!: number;

  @ApiProperty({
    example: 1200,
  })
  @IsNumber()
  area!: number;

  @ApiProperty({
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @ApiProperty({
    enum: FurnishingType,
    example: FurnishingType.SEMI_FURNISHED,
  })
  @IsEnum(FurnishingType)
  furnishing!: FurnishingType;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  parking!: boolean;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  petFriendly!: boolean;

  @ApiProperty({
    example: 50000,
  })
  @IsNumber()
  securityDeposit!: number;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Allow short stays charged per day',
  })
  @IsOptional()
  @IsBoolean()
  dailyRentEnabled?: boolean;

  @ApiProperty({
    required: false,
    example: 1800,
    description: 'Owner-defined daily rent in INR',
  })
  @ValidateIf((dto: CreatePropertyDto) => dto.dailyRentEnabled === true)
  @IsNumber()
  @IsPositive()
  dailyRent?: number;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'List of Amenity IDs',
    example: [
      'cmrabc123456789',
      'cmrxyz987654321',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityIds?: string[];
}
