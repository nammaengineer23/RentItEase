import { IsString } from 'class-validator';

export class PromotePropertyDto {
  @IsString()
  propertyId!: string;
}
