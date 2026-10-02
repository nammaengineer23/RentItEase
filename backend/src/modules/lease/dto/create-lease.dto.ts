import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateLeaseDto {
  @ApiProperty({
    description: 'Booking ID from which the lease is created',
  })
  @IsString()
  bookingId!: string;

  @ApiProperty({
    description: 'Lease start date in ISO 8601 format',
    example: '2026-08-15T00:00:00.000Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    description: 'Optional lease end date in ISO 8601 format',
    example: '2027-08-14T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Additional lease notes',
    example: 'Standard residential lease',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}