import { ArrayNotEmpty, IsBoolean, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

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
  autoPublish!: boolean;

  @ValidateIf((dto: OwnerMarketingConsentDto) => dto.approved === true)
  @ArrayNotEmpty()
  @IsEnum(OwnerSocialPlatform, { each: true })
  platforms!: OwnerSocialPlatform[];

  @IsOptional()
  @IsString()
  consentVersion?: string;
}
