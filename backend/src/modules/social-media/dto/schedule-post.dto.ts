import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SocialPublishPlatform } from './publish-post.dto';

export class SchedulePostDto {
  @IsEnum(SocialPublishPlatform)
  platform!: SocialPublishPlatform;

  @IsOptional()
  @IsString()
  @MaxLength(63206)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsDateString()
  scheduledAt!: string;
}
