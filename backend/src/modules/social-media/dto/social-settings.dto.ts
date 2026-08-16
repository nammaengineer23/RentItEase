import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SocialAutomationMode {
  DISABLED = 'DISABLED',
  GENERATE_ONLY = 'GENERATE_ONLY',
  AUTO_PUBLISH = 'AUTO_PUBLISH',
}

export class SocialSettingsDto {
  @IsEnum(SocialAutomationMode)
  mode!: SocialAutomationMode;

  @IsOptional()
  @IsBoolean()
  instagramEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  facebookEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  youtubeEnabled?: boolean;

  @IsOptional()
  @IsString()
  defaultTemplate?: string;
}
