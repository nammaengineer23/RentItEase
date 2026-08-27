import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @ApiProperty({
    required: false,
    description: 'Whether the property is available for rent',
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
