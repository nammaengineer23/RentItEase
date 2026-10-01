import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RenewLeaseDto {
  @ApiProperty({
    description: 'New lease end date in ISO 8601 format. Must extend the current end date.',
    example: '2028-08-14T00:00:00.000Z',
  })
  @IsDateString()
  endDate!: string;
}
