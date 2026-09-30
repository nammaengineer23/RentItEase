import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsPostalCode,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FurnishingType, PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Spacious 2 BHK in HSR Layout' })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Spacious apartment with modern amenities.' })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 25000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @ApiProperty({ example: '123 MG Road' })
  @IsString()
  @MinLength(5)
  @MaxLength(250)
  address!: string;

  @ApiProperty({ required: false, example: 'HSR Layout' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  locality?: string;

  @ApiProperty({ required: false, example: 'Near BDA Complex' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  landmark?: string;

  @ApiProperty({ example: 'Bengaluru' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;

  @ApiProperty({ example: '560102' })
  @IsString()
  @IsPostalCode('IN')
  pincode!: string;

  @ApiProperty({ required: false, example: 12.9116 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ required: false, example: 77.6474 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  bedrooms!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  bathrooms!: number;

  @ApiProperty({ example: 1, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balconies?: number;

  @ApiProperty({ example: 2, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  floor?: number;

  @ApiProperty({ example: 5, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalFloors?: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @IsPositive()
  area!: number;

  @ApiProperty({ enum: PropertyType, example: PropertyType.APARTMENT })
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @ApiProperty({ enum: FurnishingType, example: FurnishingType.SEMI_FURNISHED })
  @IsEnum(FurnishingType)
  furnishing!: FurnishingType;

  @ApiProperty({ example: true })
  @IsBoolean()
  parking!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  petFriendly!: boolean;

  @ApiProperty({ example: 50000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  securityDeposit!: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  dailyRentEnabled?: boolean;

  @ApiProperty({ required: false, example: 1800 })
  @ValidateIf((dto: CreatePropertyDto) => dto.dailyRentEnabled === true)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  dailyRent?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  amenityIds?: string[];
}
