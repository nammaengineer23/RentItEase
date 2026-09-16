import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SocialMediaController } from './social-media.controller';
import { SocialMediaActivityController } from './social-media-activity.controller';
import { OwnerSocialMediaController } from './owner-social-media.controller';
import { SocialMediaService } from './social-media.service';
import { FacebookService } from './publishing/facebook.service';
import { InstagramService } from './publishing/instagram.service';
import { PublishingService } from './publishing/publishing.service';
import { YouTubeService } from './publishing/youtube.service';
import { SocialMediaProcessor } from './processors/social-media.processor';
import { VideoGeneratorService } from './video/video-generator.service';
import { VideoService } from './video/video.service';
import { VideoTemplateService } from './video/video-template.service';
import { SocialMediaStorageService } from './social-media.storage.service';
import { CampaignSchedulerService } from './campaigns/campaign-scheduler.service';

@Module({
  imports: [PrismaModule],
  controllers: [SocialMediaController, SocialMediaActivityController, OwnerSocialMediaController],
  providers: [
    SocialMediaService,
    SocialMediaProcessor,
    VideoService,
    VideoGeneratorService,
    VideoTemplateService,
    PublishingService,
    InstagramService,
    FacebookService,
    YouTubeService,
    SocialMediaStorageService,
    CampaignSchedulerService,
  ],
  exports: [SocialMediaService],
})
export class SocialMediaModule {}
