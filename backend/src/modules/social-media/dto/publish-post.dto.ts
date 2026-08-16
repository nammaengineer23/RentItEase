import { IsEnum, IsOptional, IsString } from 'class-validator';

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
  caption?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
