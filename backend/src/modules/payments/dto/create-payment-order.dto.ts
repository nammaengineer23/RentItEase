import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty({
    description: 'Booking ID for which the payment order should be created',
    example: 'cmxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  bookingId!: string;
}
