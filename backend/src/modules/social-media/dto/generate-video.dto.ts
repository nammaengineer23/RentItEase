import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SocialVideoPlatform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  YOUTUBE = 'YOUTUBE',
}

export class GenerateVideoDto {
  @IsString()
  propertyId!: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(8)
  secondsPerPhoto?: number;

  @IsOptional()
  @IsBoolean()
  autoPublish?: boolean;

  @IsOptional()
  @IsEnum(SocialVideoPlatform, { each: true })
  platforms?: SocialVideoPlatform[];
}
