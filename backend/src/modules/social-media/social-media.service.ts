import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SocialPlatform, SocialPostStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { SocialSettingsDto } from './dto/social-settings.dto';
import { PublishingService } from './publishing/publishing.service';
import { SocialMediaStorageService } from './social-media.storage.service';
import { VideoService } from './video/video.service';

@Injectable()
export class SocialMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: VideoService,
    private readonly publishing: PublishingService,
    private readonly storage: SocialMediaStorageService,
  ) {}

  async generate(dto: GenerateVideoDto) {
    const generated = await this.videoService.generate(dto.propertyId, dto.secondsPerPhoto);
    const videoUrl = await this.storage.uploadVideo(generated.filePath, dto.propertyId);
    return { ...generated, videoUrl };
  }

  async publish(dto: PublishPostDto & { propertyId: string; actorId: string }) {
    const post = await this.createPost(dto);
    return this.publishPost(post.id, dto.actorId);
  }

  async saveOwnerConsent(dto: {
    propertyId: string;
    ownerId: string;
    approved: boolean;
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
        consentVersion: dto.consentVersion || '1.0',
        consentedAt: new Date(),
      },
      update: {
        approved: dto.approved,
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
    const consent = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId } });
    return {
      skipped: true,
      reason: consent?.approved
        ? 'Owner consent is recorded. An administrator must create or schedule a publication.'
        : 'Owner social-marketing consent is required before an administrator can publish.',
    };
  }

  async settings() {
    const saved = await this.prisma.socialMediaSetting.findUnique({ where: { key: 'marketing' } });
    const savedValue = (saved?.value ?? {}) as Record<string, unknown>;
    return {
      mode: savedValue.mode || process.env.SOCIAL_AUTOMATION_MODE || 'GENERATE_ONLY',
      instagramEnabled: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID),
      facebookEnabled: Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
      youtubeEnabled: Boolean(
        process.env.YOUTUBE_CLIENT_ID &&
        process.env.YOUTUBE_CLIENT_SECRET &&
        process.env.YOUTUBE_REFRESH_TOKEN,
      ),
      defaultTemplate: savedValue.defaultTemplate || 'PROPERTY_REEL_9_16',
      automaticPublishing: false,
    };
  }

  listProperties() {
    return this.prisma.property.findMany({
      include: {
        owner: { select: { id: true, fullName: true } },
        socialMarketingConsent: true,
        socialMediaPosts: { orderBy: { createdAt: 'desc' }, take: 5 },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async analytics() {
    const [posts, snapshots] = await Promise.all([
      this.prisma.socialMediaPost.findMany({ select: { platform: true, status: true } }),
      this.prisma.socialAnalyticsSnapshot.findMany({
        select: { impressions: true, clicks: true, likes: true, shares: true, leads: true },
      }),
    ]);
    return {
      totalPosts: posts.length,
      published: posts.filter((post) => post.status === 'PUBLISHED').length,
      failed: posts.filter((post) => post.status === 'FAILED').length,
      pending: posts.filter((post) => post.status === 'PENDING').length,
      instagram: posts.filter((post) => post.platform === 'INSTAGRAM').length,
      facebook: posts.filter((post) => post.platform === 'FACEBOOK').length,
      youtube: posts.filter((post) => post.platform === 'YOUTUBE').length,
      scheduled: posts.filter((post) => post.status === 'PENDING').length,
      engagement: snapshots.reduce(
        (total, snapshot) => ({
          impressions: total.impressions + snapshot.impressions,
          clicks: total.clicks + snapshot.clicks,
          likes: total.likes + snapshot.likes,
          shares: total.shares + snapshot.shares,
          leads: total.leads + snapshot.leads,
        }),
        { impressions: 0, clicks: 0, likes: 0, shares: 0, leads: 0 },
      ),
    };
  }

  async recordAnalytics(
    postId: string,
    actorId: string,
    metrics: { impressions?: number; clicks?: number; likes?: number; shares?: number; leads?: number },
  ) {
    const post = await this.prisma.socialMediaPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Social post not found.');
    const snapshot = await this.prisma.socialAnalyticsSnapshot.create({
      data: {
        postId,
        platform: post.platform,
        impressions: metrics.impressions ?? 0,
        clicks: metrics.clicks ?? 0,
        likes: metrics.likes ?? 0,
        shares: metrics.shares ?? 0,
        leads: metrics.leads ?? 0,
      },
    });
    await this.audit(post.propertyId, actorId, 'ANALYTICS_RECORDED', postId, metrics);
    return snapshot;
  }

  async updateSettings(dto: SocialSettingsDto) {
    const value = { ...dto, automaticPublishing: false };
    await this.prisma.socialMediaSetting.upsert({
      where: { key: 'marketing' },
      create: { key: 'marketing', value },
      update: { value },
    });
    return { ...value, persisted: true };
  }

  async schedule(dto: PublishPostDto & { propertyId: string; actorId: string; scheduledAt: Date }) {
    if (dto.scheduledAt <= new Date()) throw new BadRequestException('Schedule time must be in the future.');
    const post = await this.createPost(dto);
    await this.prisma.socialMediaPost.update({
      where: { id: post.id },
      data: { scheduledAt: dto.scheduledAt },
    });
    await this.audit(dto.propertyId, dto.actorId, 'POST_SCHEDULED', post.id, { scheduledAt: dto.scheduledAt.toISOString() });
    return { ...post, scheduledAt: dto.scheduledAt };
  }

  async processDuePosts() {
    const now = new Date();
    const posts = await this.prisma.socialMediaPost.findMany({
      where: {
        OR: [
          { status: SocialPostStatus.PENDING, scheduledAt: { lte: now } },
          { status: SocialPostStatus.FAILED, nextRetryAt: { lte: now } },
        ],
      },
      select: { id: true, propertyId: true },
      take: 20,
      orderBy: { scheduledAt: 'asc' },
    });
    return Promise.all(posts.map((post) => this.publishPost(post.id, 'system')));
  }

  async retry(postId: string, actorId: string) {
    const post = await this.prisma.socialMediaPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Social post not found.');
    if (post.status !== SocialPostStatus.FAILED) throw new BadRequestException('Only failed posts can be retried.');
    if (post.attemptCount >= post.maxAttempts) throw new BadRequestException('Maximum retry attempts reached.');
    return this.publishPost(postId, actorId);
  }

  private async createPost(dto: PublishPostDto & { propertyId: string; actorId: string }) {
    const consent = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId: dto.propertyId } });
    if (!consent?.approved) throw new BadRequestException('Owner marketing consent is required before publishing.');
    const post = await this.prisma.socialMediaPost.create({
      data: { propertyId: dto.propertyId, consentId: consent.id, platform: dto.platform as SocialPlatform, caption: dto.caption },
    });
    await this.audit(dto.propertyId, dto.actorId, 'POST_CREATED', post.id, { platform: dto.platform });
    return post;
  }

  private async publishPost(postId: string, actorId: string) {
    const post = await this.prisma.socialMediaPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Social post not found.');
    const consent = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId: post.propertyId } });
    if (!consent?.approved) throw new BadRequestException('Owner marketing consent has been revoked or is missing.');
    const attemptCount = post.attemptCount + 1;
    await this.prisma.socialMediaPost.update({ where: { id: postId }, data: { status: SocialPostStatus.PUBLISHING, attemptCount, lastAttemptAt: new Date(), nextRetryAt: null } });
    try {
      const generated = await this.videoService.generate(post.propertyId);
      const videoUrl = await this.storage.uploadVideo(generated.filePath, post.propertyId);
      const published = await this.publishing.publish(post.platform as any, { videoUrl, filePath: generated.filePath, caption: post.caption || generated.caption, title: generated.videoTitle });
      const result = await this.prisma.socialMediaPost.update({ where: { id: postId }, data: { status: SocialPostStatus.PUBLISHED, videoUrl, externalId: published.externalId, publishedAt: new Date(), error: null } });
      await this.audit(post.propertyId, actorId, 'POST_PUBLISHED', postId, { platform: post.platform, externalId: published.externalId });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryAt = attemptCount < post.maxAttempts ? new Date(Date.now() + 2 ** attemptCount * 60_000) : null;
      const result = await this.prisma.socialMediaPost.update({ where: { id: postId }, data: { status: SocialPostStatus.FAILED, error: message, nextRetryAt: retryAt } });
      await this.audit(post.propertyId, actorId, 'POST_FAILED', postId, { attemptCount, retryAt: retryAt?.toISOString(), message });
      return result;
    }
  }

  private audit(propertyId: string, actorId: string, eventType: string, postId?: string, details?: Record<string, unknown>) {
    return this.prisma.socialMediaAuditEvent.create({ data: { propertyId, actorId, postId, eventType, details } });
  }
}
