import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OwnerMarketingConsentDto {
  @IsString()
  propertyId!: string;

  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  consentVersion?: string;
}
