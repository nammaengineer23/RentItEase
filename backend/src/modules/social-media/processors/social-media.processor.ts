import { Injectable, Logger } from '@nestjs/common';
import { SocialPlatform, SocialPostStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PublishingService, PublishPlatform } from '../publishing/publishing.service';
import { VideoService } from '../video/video.service';
import { SocialMediaStorageService } from '../social-media.storage.service';

@Injectable()
export class SocialMediaProcessor {
  private readonly logger = new Logger(SocialMediaProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: VideoService,
    private readonly publishingService: PublishingService,
    private readonly storage: SocialMediaStorageService,
  ) {}

  async processApprovedProperty(propertyId: string, platforms: PublishPlatform[]) {
    const generated = await this.videoService.generate(propertyId);

    const publicVideoUrl = await this.storage.uploadVideo(generated.filePath, propertyId);

    const result = {
      propertyId,
      videoPath: generated.filePath,
      durationSeconds: generated.durationSeconds,
      caption: generated.caption,
      videoTitle: generated.videoTitle,
      publications: [] as Array<{ platform: string; success: boolean; externalId?: string; error?: string }>,
    };

    for (const platform of platforms) {
      const post = await this.prisma.socialMediaPost.create({
        data: {
          propertyId,
          platform: platform as SocialPlatform,
          status: SocialPostStatus.PUBLISHING,
          caption: generated.caption,
          videoUrl: publicVideoUrl,
        },
      });

      try {
        const published = await this.publishingService.publish(platform, {
          videoUrl: publicVideoUrl,
          filePath: generated.filePath,
          caption: generated.caption,
          title: generated.videoTitle,
        });

        await this.prisma.socialMediaPost.update({
          where: { id: post.id },
          data: {
            status: SocialPostStatus.PUBLISHED,
            externalId: published.externalId,
            publishedAt: new Date(),
          },
        });

        result.publications.push({
          platform,
          success: true,
          externalId: published.externalId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`${platform} publication failed for ${propertyId}: ${message}`);

        await this.prisma.socialMediaPost.update({
          where: { id: post.id },
          data: {
            status: SocialPostStatus.FAILED,
            error: message,
          },
        });

        result.publications.push({ platform, success: false, error: message });
      }
    }

    return result;
  }
}
