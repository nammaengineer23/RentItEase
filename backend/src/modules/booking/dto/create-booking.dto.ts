import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Property visit ID from which the booking is created',
  })
  @IsString()
  visitId!: string;

  @ApiProperty({
    description: 'Optional booking notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
