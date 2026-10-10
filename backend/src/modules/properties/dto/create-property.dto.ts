import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import {
  FurnishingType,
  PropertyType,
  PropertyTransactionType,
} from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({
    example: '',
  })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'Spacious apartment with modern amenities.',
  })
  @IsString()
  @MaxLength(10000)
  description!: string;

  @ApiProperty({
    example: 25000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({
    example: '123 MG Road',
  })
  @IsString()
  @MaxLength(300)
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
  @MaxLength(100)
  city!: string;

  @ApiProperty({
    example: 'Karnataka',
  })
  @IsString()
  @MaxLength(100)
  state!: string;

  @ApiProperty({
    example: 'India',
  })
  @IsString()
  @MaxLength(100)
  country!: string;

  @ApiProperty({
    example: '560102',
  })
  @IsString()
  @MaxLength(20)
  pincode!: string;

  @ApiProperty({
    required: false,
    example: 12.9116,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    required: false,
    example: 77.6474,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    example: 2,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  bedrooms!: number;

  @ApiProperty({
    example: 2,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  bathrooms!: number;

  @ApiProperty({ example: 1, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  balconies?: number;

  @ApiProperty({ example: 2, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  floor?: number;

  @ApiProperty({ example: 5, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  totalFloors?: number;

  @ApiProperty({
    example: 1200,
  })
  @IsNumber()
  @Min(0)
  @Max(10000000)
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
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  dailyRent?: number;

  @ApiProperty({ enum: PropertyTransactionType, required: false, default: PropertyTransactionType.RENT })
  @IsOptional()
  @IsEnum(PropertyTransactionType)
  transactionType?: PropertyTransactionType;

  @ApiProperty({ required: false, example: 25000000, description: 'Asking price in INR for sale listings' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  askingPrice?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  priceNegotiable?: boolean;

  @ApiProperty({ required: false, example: 24, description: 'Lease duration in months' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(600)
  leaseTermMonths?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  leaseRenewalTerms?: string;

  @ApiProperty({ required: false, example: 1200 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(100000000)
  landArea?: number;

  @ApiProperty({ required: false, example: 'sq_ft' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  landAreaUnit?: string;

  @ApiProperty({ required: false, example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  siteFrontage?: number;

  @ApiProperty({ required: false, example: 'NORTH' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  siteFacing?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  roadAccess?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  zoning?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  layoutApprovalDetails?: string;

  @ApiProperty({ required: false, description: 'Non-sensitive survey reference only; never upload private identity/document numbers here.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  surveyReference?: string;

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
  @ArrayMaxSize(100)
  amenityIds?: string[];
}
