import { IsBoolean, IsOptional, IsString } from 'class-validator';

export enum OwnerSocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  YOUTUBE = 'YOUTUBE',
}

export class OwnerMarketingConsentDto {
  @IsString()
  propertyId!: string;

  @IsBoolean()
  approved!: boolean;

  @IsBoolean()

  @IsOptional()
  @IsString()
  consentVersion?: string;
}
