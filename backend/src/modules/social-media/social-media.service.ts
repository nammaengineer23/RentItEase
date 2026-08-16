import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GenerateVideoDto, SocialVideoPlatform } from './dto/generate-video.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { SocialSettingsDto } from './dto/social-settings.dto';
import { PublishingService } from './publishing/publishing.service';
import { SocialMediaStorageService } from './social-media.storage.service';
import { SocialMediaProcessor } from './processors/social-media.processor';
import { VideoService } from './video/video.service';

@Injectable()
export class SocialMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: VideoService,
    private readonly processor: SocialMediaProcessor,
    private readonly publishing: PublishingService,
    private readonly storage: SocialMediaStorageService,
  ) {}

  async generate(dto: GenerateVideoDto) {
    const generated = await this.videoService.generate(dto.propertyId, dto.secondsPerPhoto);
    const videoUrl = await this.storage.uploadVideo(generated.filePath, dto.propertyId);
    return { ...generated, videoUrl };
  }

  async publish(dto: PublishPostDto & { propertyId: string }) {
    const generated = await this.videoService.generate(dto.propertyId);
    const publicVideoUrl = await this.storage.uploadVideo(generated.filePath, dto.propertyId);
    const platform = dto.platform as 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';

    return this.publishing.publish(platform, {
      videoUrl: publicVideoUrl,
      filePath: generated.filePath,
      caption: dto.caption || generated.caption,
      title: dto.title || generated.videoTitle,
    });
  }

  async saveOwnerConsent(dto: {
    propertyId: string;
    ownerId: string;
    approved: boolean;
    autoPublish: boolean;
    platforms: string[];
    consentVersion?: string;
  }) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, ownerId: dto.ownerId },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Property not found or does not belong to the authenticated owner.');

    return this.prisma.socialMarketingConsent.upsert({
      where: { propertyId: dto.propertyId },
      create: {
        propertyId: dto.propertyId,
        ownerId: dto.ownerId,
        approved: dto.approved,
        autoPublish: dto.autoPublish,
        platforms: dto.platforms,
        consentVersion: dto.consentVersion || '1.0',
        consentedAt: new Date(),
      },
      update: {
        approved: dto.approved,
        autoPublish: dto.autoPublish,
        platforms: dto.platforms,
        consentVersion: dto.consentVersion || '1.0',
        consentedAt: new Date(),
        revokedAt: dto.approved ? null : new Date(),
      },
    });
  }

  async getOwnerConsent(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, ownerId },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Property not found or does not belong to the authenticated owner.');

    return this.prisma.socialMarketingConsent.findUnique({
      where: { propertyId },
    });
  }

  async onPropertyApproved(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true, images: true },
    });

    if (!property) throw new NotFoundException('Property not found');

    const consent = await this.prisma.socialMarketingConsent.findUnique({
      where: { propertyId },
    });

    if (!consent?.approved || !consent.autoPublish) {
      return {
        skipped: true,
        reason: 'Owner social-marketing consent is missing or auto-publish is disabled.',
      };
    }

    const platforms = consent.platforms as SocialVideoPlatform[];
    if (!platforms.length) {
      throw new BadRequestException('Owner consent exists, but no social platforms were selected.');
    }

    return this.processor.processApprovedProperty(propertyId, platforms as any);
  }

  async settings() {
    return {
      mode: process.env.SOCIAL_AUTOMATION_MODE || 'GENERATE_ONLY',
      instagramEnabled: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID),
      facebookEnabled: Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
      youtubeEnabled: Boolean(
        process.env.YOUTUBE_CLIENT_ID &&
        process.env.YOUTUBE_CLIENT_SECRET &&
        process.env.YOUTUBE_REFRESH_TOKEN,
      ),
      defaultTemplate: 'PROPERTY_REEL_9_16',
    };
  }

  async updateSettings(dto: SocialSettingsDto) {
    // Runtime settings are intentionally returned rather than persisted in this
    // first batch. Persist admin settings in a dedicated system-settings table
    // after the workflow is verified.
    return {
      ...dto,
      persisted: false,
      message: 'Settings accepted for verification. Persist them after the first end-to-end test.',
    };
  }
}
