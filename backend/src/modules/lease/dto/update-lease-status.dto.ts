import { ApiProperty } from '@nestjs/swagger';
import { LeaseStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateLeaseStatusDto {
  @ApiProperty({
    enum: LeaseStatus,
    description: 'New lease status',
    example: LeaseStatus.ACTIVE,
  })
  @IsEnum(LeaseStatus)
  status!: LeaseStatus;
}