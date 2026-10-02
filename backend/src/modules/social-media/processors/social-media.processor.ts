import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SocialPlatform, SocialPostStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SocialMediaStorageService } from '../social-media.storage.service';
import { RemotionVideoService } from '../video/remotion-video.service';
import { PublishPlatform } from '../publishing/publishing.service';

@Injectable()
export class SocialMediaProcessor {
  private readonly logger = new Logger(SocialMediaProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: RemotionVideoService,
    private readonly storage: SocialMediaStorageService,
  ) {}

  async processApprovedProperty(propertyId: string, platforms: PublishPlatform[]) {
    const consent = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId } });
    if (!consent?.approved) throw new BadRequestException('Owner marketing consent is required.');
    const generated = await this.videoService.generate(propertyId);
    const publicVideoUrl = await this.storage.importRemoteVideo(generated.videoUrl, propertyId);
    await this.storage.deleteStoredVideo(consent.preparedVideoUrl);
    await this.prisma.socialMarketingConsent.update({
      where: { propertyId },
      data: { preparedVideoUrl: publicVideoUrl, preparedCaption: generated.caption, preparedTitle: generated.videoTitle, preparedAt: new Date() },
    });

    const publications: Array<{ platform: string; status: string; postId: string }> = [];
    for (const platform of platforms) {
      const idempotencyKey = [propertyId, platform, consent.id, 'prepared'].join(':');
      const post = await this.prisma.socialMediaPost.upsert({
        where: { idempotencyKey },
        create: { propertyId, consentId: consent.id, platform: platform as SocialPlatform, status: SocialPostStatus.READY, caption: generated.caption, videoUrl: publicVideoUrl, idempotencyKey },
        update: { status: SocialPostStatus.READY, caption: generated.caption, videoUrl: publicVideoUrl },
      });
      publications.push({ platform, status: post.status, postId: post.id });
    }
    this.logger.log('Prepared social content for admin review');
    return { propertyId, videoUrl: publicVideoUrl, durationSeconds: generated.durationSeconds, caption: generated.caption, videoTitle: generated.videoTitle, publications, reviewRequired: true };
  }
}
