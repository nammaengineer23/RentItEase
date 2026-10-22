import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePropertyEnquiryDto {
  @ApiProperty({ description: 'ID of the property being enquired about' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  propertyId!: string;

  @ApiProperty({ description: 'Question or message for the property owner', example: 'Is this property still available? Can I arrange a viewing?' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;
}

export class UpdatePropertyEnquiryStatusDto {
  @ApiProperty({ enum: ['OPEN', 'CONTACTED', 'CLOSED'] })
  @IsString()
  status!: 'OPEN' | 'CONTACTED' | 'CLOSED';

  @ApiPropertyOptional({ description: 'Optional reason for closing or updating the enquiry' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
