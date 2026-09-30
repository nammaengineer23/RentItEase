import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class NearbyPropertiesDto {
  @ApiPropertyOptional({ example: 12.9116 })
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @ApiPropertyOptional({ example: 77.6474 })
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Radius in KM',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radius?: number = 5;
}