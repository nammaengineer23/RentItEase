import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class NearbyPropertiesDto {
  @ApiPropertyOptional({ example: 12.9116 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiPropertyOptional({ example: 77.6474 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: 5, default: 5, description: 'Radius in KM, maximum 50' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius = 5;
}
