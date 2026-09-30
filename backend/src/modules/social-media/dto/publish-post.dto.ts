import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum SocialPublishPlatform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  YOUTUBE = 'YOUTUBE',
}

export class PublishPostDto {
  @IsEnum(SocialPublishPlatform)
  platform!: SocialPublishPlatform;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}
