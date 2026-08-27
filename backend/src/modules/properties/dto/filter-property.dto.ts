import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  FurnishingType,
  PropertyStatus,
  PropertyType,
} from '@prisma/client';

import {
  Transform,
  Type,
} from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';


export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}


export class FilterPropertiesDto {


  @ApiPropertyOptional({
    description: 'Search title, city, locality',
    example: 'Luxury Apartment',
  })
  @IsOptional()
  @IsString()
  search?: string;



  @ApiPropertyOptional({
    example: 'Bangalore',
  })
  @IsOptional()
  @IsString()
  city?: string;



  @ApiPropertyOptional({
    example: 'HSR Layout',
  })
  @IsOptional()
  @IsString()
  locality?: string;



  @ApiPropertyOptional({
    example: '560102',
  })
  @IsOptional()
  @IsString()
  pincode?: string;



  @ApiPropertyOptional({
    enum: PropertyType,
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;



  // ============================
  // Amenities Filter
  // ============================

  @ApiPropertyOptional({
    example:
      'cmrua1zce0000v5lwl5p0fbf5,cmrubj9820000v5d011i7v853',
    description:
      'Filter by amenity IDs comma separated',
  })
  @IsOptional()
  @Transform(({ value }) => {

    if (!value) {
      return undefined;
    }


    if (Array.isArray(value)) {
      return value;
    }


    return value
      .split(',')
      .map((id:string)=>id.trim());

  })
  amenities?: string[];



  @ApiPropertyOptional({
    enum:FurnishingType,
  })
  @IsOptional()
  @IsEnum(FurnishingType)
  furnishing?: FurnishingType;



  @ApiPropertyOptional({
    example:2,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsInt()
  bedrooms?:number;



  @ApiPropertyOptional({
    example:2,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsInt()
  bathrooms?:number;



  @ApiPropertyOptional({
    example:10000,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsNumber()
  minPrice?:number;



  @ApiPropertyOptional({
    example:50000,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsNumber()
  maxPrice?:number;



  @ApiPropertyOptional({
    example:500,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsNumber()
  minArea?:number;



  @ApiPropertyOptional({
    example:2000,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsNumber()
  maxArea?:number;



  @ApiPropertyOptional({
    example:true,
  })
  @IsOptional()
  @Transform(({value})=>{

    if(value===undefined)
      return undefined;

    return value === true ||
           value === 'true';

  })
  @IsBoolean()
  parking?:boolean;



  @ApiPropertyOptional({
    example:true,
  })
  @IsOptional()
  @Transform(({value})=>{

    if(value===undefined)
      return undefined;

    return value === true ||
           value === 'true';

  })
  @IsBoolean()
  petFriendly?:boolean;



  @ApiPropertyOptional({
    example:true,
  })
  @IsOptional()
  @Transform(({value})=>{

    if(value===undefined)
      return undefined;

    return value === true ||
           value === 'true';

  })
  @IsBoolean()
  isAvailable?:boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  dailyRentEnabled?: boolean;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minDailyRent?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDailyRent?: number;



  @ApiPropertyOptional({
    enum:PropertyStatus,
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?:PropertyStatus;



  // Pagination

  @ApiPropertyOptional({
    default:1,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsInt()
  @Min(1)
  page:number=1;



  @ApiPropertyOptional({
    default:10,
  })
  @IsOptional()
  @Type(()=>Number)
  @IsInt()
  @Min(1)
  limit:number=10;



  // Sorting

  @ApiPropertyOptional({
    default:'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy:string='createdAt';



  @ApiPropertyOptional({
    enum:SortOrder,
    default:SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order:SortOrder=SortOrder.DESC;

}
