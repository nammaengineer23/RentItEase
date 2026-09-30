import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SocialPublishPlatform } from './publish-post.dto';

export class SocialAccountConnectionDto {
  @IsEnum(SocialPublishPlatform)
  platform!: SocialPublishPlatform;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  accountId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  accountName?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(4096)
  accessToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  refreshToken?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class SocialAccountDisconnectDto {
  @IsEnum(SocialPublishPlatform)
  platform!: SocialPublishPlatform;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  accountId!: string;
}
