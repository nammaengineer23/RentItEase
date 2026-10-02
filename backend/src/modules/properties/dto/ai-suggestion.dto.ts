import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class AiSuggestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  propertyType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  locality?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bedrooms?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  furnishing?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000_000)
  rent?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((item) => (typeof item === 'string' ? item.trim() : item)) : value,
  )
  amenities?: string[];
}
