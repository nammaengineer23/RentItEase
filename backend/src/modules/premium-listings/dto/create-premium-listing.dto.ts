import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePremiumListingDto {
  @IsString()
  propertyId!: string;

  @IsOptional()
  @IsString()
  membershipId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
