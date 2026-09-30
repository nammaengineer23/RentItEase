import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SocialPlatform, SocialPostStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { SocialSettingsDto } from './dto/social-settings.dto';
import { PublishingService } from './publishing/publishing.service';
import { SocialMediaStorageService } from './social-media.storage.service';
import { RemotionVideoService } from './video/remotion-video.service';
import { VideoTemplateService, PropertyVideoData } from './video/video-template.service';

@Injectable()
export class SocialMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly remotionVideo: RemotionVideoService,
    private readonly publishing: PublishingService,
    private readonly storage: SocialMediaStorageService,
    private readonly template: VideoTemplateService,
  ) {}

  async generate(dto: GenerateVideoDto) {
    const consent = await this.requireConsent(dto.propertyId);
    const generated = await this.remotionVideo.generate(dto.propertyId);
    // Keep the completed self-hosted Remotion render in our
    // Firebase storage before presenting it to the admin for review/publish.
    const videoUrl = await this.storage.importRemoteVideo(
      generated.videoUrl,
      dto.propertyId,
    );
    await this.storage.deleteStoredVideo(consent.preparedVideoUrl);
    await this.prisma.socialMarketingConsent.update({
      where: { propertyId: dto.propertyId },
      data: {
        preparedVideoUrl: videoUrl,
        preparedCaption: generated.caption,
        preparedTitle: generated.videoTitle,
        preparedAt: new Date(),
      },
    });
    return { ...generated, videoUrl };
  }

  async usePropertyVideo(propertyId: string, actorId: string, body: { title?: string; caption?: string }) {
    await this.requireConsent(propertyId);
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { videoUrl: true },
    });
    if (!property) throw new NotFoundException('Property not found.');
    if (!property.videoUrl) throw new BadRequestException('This property does not have a video tour yet.');

    // Never publish the raw property tour from this action. Render it through
    // the same branded Remotion pipeline so the primary photo is the opening
    // cover and the property video receives the RentItEase text overlays.
    const generated = await this.remotionVideo.generate(propertyId);
    const videoUrl = await this.storage.importRemoteVideo(
      generated.videoUrl,
      propertyId,
    );
    const title = body.title?.trim() || generated.videoTitle;
    const caption = body.caption?.trim() || generated.caption;
    this.validatePlatformContent(SocialPlatform.INSTAGRAM, title, caption);

    const previousPreparedVideo = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId }, select: { preparedVideoUrl: true } });
    await this.storage.deleteStoredVideo(previousPreparedVideo?.preparedVideoUrl);
    await this.prisma.socialMarketingConsent.update({
      where: { propertyId },
      data: {
        preparedVideoUrl: videoUrl,
        preparedTitle: title,
        preparedCaption: caption,
        preparedAt: new Date(),
      },
    });
    await this.audit(propertyId, actorId, 'PROPERTY_VIDEO_REEL_GENERATED', undefined, {
      sourceVideoUrl: property.videoUrl,
      preparedVideoUrl: videoUrl,
      renderId: generated.renderId,
    });
    return {
      ...generated,
      videoUrl,
      videoTitle: title,
      caption,
      source: 'REMOTION_PROPERTY_VIDEO',
    };
  }

  async uploadPreparedReel(propertyId: string, actorId: string, file: Express.Multer.File | undefined, body: { title?: string; caption?: string }) {
    await this.requireConsent(propertyId);
    if (!file?.buffer?.length) throw new BadRequestException('Choose a reel video to upload.');
    if (file.size > 100 * 1024 * 1024) throw new BadRequestException('Reel must be 100 MB or smaller.');
    const property = await this.prisma.property.findUnique({ where: { id: propertyId }, select: { title: true } });
    if (!property) throw new NotFoundException('Property not found.');
    const videoUrl = await this.storage.uploadBuffer(file.buffer, propertyId, file.mimetype || 'video/mp4');
    const title = body.title?.trim() || property.title || 'RentItEase property tour';
    const caption = body.caption?.trim() || '';
    this.validatePlatformContent(SocialPlatform.INSTAGRAM, title, caption);
    const previousPreparedVideo = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId }, select: { preparedVideoUrl: true } });
    await this.storage.deleteStoredVideo(previousPreparedVideo?.preparedVideoUrl);
    await this.prisma.socialMarketingConsent.update({
      where: { propertyId },
      data: { preparedVideoUrl: videoUrl, preparedTitle: title, preparedCaption: caption, preparedAt: new Date() },
    });
    await this.audit(propertyId, actorId, 'PREPARED_REEL_UPLOADED', undefined, { videoUrl, bytes: file.size });
    return { videoUrl, videoTitle: title, caption, source: 'UPLOADED_REEL' };
  }

  async publish(dto: PublishPostDto & { propertyId: string; actorId: string }) {
    // Publishing is always an explicit admin action. Automatic property
    // processing only prepares reviewable content and never selects a platform.
    const post = await this.createPost(dto);
    return this.publishPost(post.id, dto.actorId);
  }

  async saveOwnerConsent(dto: { propertyId: string; ownerId: string; approved: boolean; consentVersion?: string }) {
    const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, ownerId: dto.ownerId }, select: { id: true } });
    if (!property) throw new NotFoundException('Property not found or does not belong to the authenticated owner.');
    const consent = await this.prisma.socialMarketingConsent.upsert({
      where: { propertyId: dto.propertyId },
      create: { propertyId: dto.propertyId, ownerId: dto.ownerId, approved: dto.approved, consentVersion: dto.consentVersion || '1.0', consentedAt: dto.approved ? new Date() : null, revokedAt: dto.approved ? null : new Date() },
      update: { approved: dto.approved, consentVersion: dto.consentVersion || '1.0', consentedAt: dto.approved ? new Date() : undefined, revokedAt: dto.approved ? null : new Date() },
    });
    if (!dto.approved) {
      const cancelled = await this.prisma.socialMediaPost.updateMany({
        where: { propertyId: dto.propertyId, status: { in: [SocialPostStatus.PENDING, SocialPostStatus.READY, SocialPostStatus.FAILED] } },
        data: { status: SocialPostStatus.CANCELLED, scheduledAt: null, nextRetryAt: null, processingToken: null, processingLeaseUntil: null },
      });
      if (cancelled.count) await this.audit(dto.propertyId, dto.ownerId, 'CONSENT_REVOKED_POSTS_CANCELLED', undefined, { count: cancelled.count });
    } else {
      await this.audit(dto.propertyId, dto.ownerId, 'CONSENT_GRANTED', undefined, { consentVersion: consent.consentVersion });
    }
    return consent;
  }

  async getOwnerConsent(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, ownerId },
      select: { id: true },
    });
    if (!property)
      throw new NotFoundException(
        'Property not found or does not belong to the authenticated owner.',
      );

    return this.prisma.socialMarketingConsent.findUnique({
      where: { propertyId },
    });
  }

  async onPropertyApproved(propertyId: string) {
    const consent = await this.prisma.socialMarketingConsent.findUnique({
      where: { propertyId },
    });
    if (!consent?.approved) {
      return {
        skipped: true,
        reason: 'Owner social-marketing consent is required before content can be prepared.',
      };
    }

    const generated = await this.remotionVideo.generate(propertyId);
    const videoUrl = await this.storage.importRemoteVideo(
      generated.videoUrl,
      propertyId,
    );
    await this.prisma.socialMarketingConsent.update({
      where: { propertyId },
      data: {
        preparedVideoUrl: videoUrl,
        preparedCaption: generated.caption,
        preparedTitle: generated.videoTitle,
        preparedAt: new Date(),
      },
    });
    await this.audit(propertyId, 'system', 'REEL_AUTO_GENERATED', undefined, {
      videoUrl,
      durationSeconds: generated.durationSeconds,
      source: 'REMOTION_PROPERTY_APPROVAL',
    });
    return {
      skipped: false,
      reviewRequired: true,
      propertyId,
      videoUrl,
      caption: generated.caption,
      videoTitle: generated.videoTitle,
      durationSeconds: generated.durationSeconds,
      message: 'Reel prepared automatically. Admin review and platform selection are required before publishing.',
    };
  }

  async settings() {
    const saved = await this.prisma.socialMediaSetting.findUnique({
      where: { key: 'marketing' },
    });
    const savedValue = (saved?.value ?? {}) as Record<string, unknown>;
    return {
      mode:
        savedValue.mode ||
        process.env.SOCIAL_AUTOMATION_MODE ||
        'GENERATE_ONLY',
      instagramEnabled: Boolean(
        process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID,
      ),
      facebookEnabled: Boolean(
        process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID,
      ),
      youtubeEnabled: Boolean(
        process.env.YOUTUBE_CLIENT_ID &&
        process.env.YOUTUBE_CLIENT_SECRET &&
        process.env.YOUTUBE_REFRESH_TOKEN,
      ),
      defaultTemplate: savedValue.defaultTemplate || 'PROPERTY_REEL_9_16',
      automaticPublishing: false,
    };
  }

  async listProperties(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [data, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where: { socialMarketingConsent: { approved: true } },
        select: {
          id: true, title: true, city: true, locality: true, createdAt: true, videoUrl: true,
          owner: { select: { id: true, fullName: true } },
          socialMarketingConsent: { select: { id: true, approved: true, consentVersion: true, consentedAt: true, preparedVideoUrl: true, preparedCaption: true, preparedTitle: true, preparedAt: true } },
          images: { where: { isPrimary: true }, select: { id: true, imageUrl: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.property.count({ where: { socialMarketingConsent: { approved: true } } }),
    ]);
    return { data, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }

  async analytics() {
    const [totalPosts, published, failed, pending, instagram, facebook, youtube, engagement] = await Promise.all([
      this.prisma.socialMediaPost.count(),
      this.prisma.socialMediaPost.count({ where: { status: SocialPostStatus.PUBLISHED } }),
      this.prisma.socialMediaPost.count({ where: { status: SocialPostStatus.FAILED } }),
      this.prisma.socialMediaPost.count({ where: { status: SocialPostStatus.PENDING } }),
      this.prisma.socialMediaPost.count({ where: { platform: SocialPlatform.INSTAGRAM } }),
      this.prisma.socialMediaPost.count({ where: { platform: SocialPlatform.FACEBOOK } }),
      this.prisma.socialMediaPost.count({ where: { platform: SocialPlatform.YOUTUBE } }),
      this.prisma.socialAnalyticsSnapshot.aggregate({ _sum: { impressions: true, clicks: true, likes: true, shares: true, leads: true } }),
    ]);
    return { totalPosts, published, failed, pending, instagram, facebook, youtube, scheduled: pending, engagement: {
      impressions: engagement._sum.impressions ?? 0, clicks: engagement._sum.clicks ?? 0, likes: engagement._sum.likes ?? 0, shares: engagement._sum.shares ?? 0, leads: engagement._sum.leads ?? 0,
    } };
  }

  async recordAnalytics(
    postId: string,
    actorId: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      likes?: number;
      shares?: number;
      leads?: number;
    },
  ) {
    const post = await this.prisma.socialMediaPost.findUnique({
      where: { id: postId },
    });
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
    await this.audit(
      post.propertyId,
      actorId,
      'ANALYTICS_RECORDED',
      postId,
      metrics,
    );
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

  async schedule(
    dto: PublishPostDto & {
      propertyId: string;
      actorId: string;
      scheduledAt: Date;
    },
  ) {
    if (dto.scheduledAt <= new Date())
      throw new BadRequestException('Schedule time must be in the future.');
    const post = await this.createPost(dto);
    await this.prisma.socialMediaPost.update({
      where: { id: post.id },
      data: { scheduledAt: dto.scheduledAt },
    });
    await this.audit(dto.propertyId, dto.actorId, 'POST_SCHEDULED', post.id, {
      scheduledAt: dto.scheduledAt.toISOString(),
    });
    return { ...post, scheduledAt: dto.scheduledAt };
  }

  async processDuePosts() {
    const now = new Date();
    const candidates = await this.prisma.socialMediaPost.findMany({
      where: { attemptCount: { lt: 3 }, OR: [
        { status: SocialPostStatus.PENDING, scheduledAt: { lte: now } },
        { status: SocialPostStatus.READY, scheduledAt: { lte: now } },
        { status: SocialPostStatus.FAILED, nextRetryAt: { lte: now } },
        { status: SocialPostStatus.PUBLISHING, processingLeaseUntil: { lt: now } },
      ] },
      select: { id: true }, take: 20, orderBy: { scheduledAt: 'asc' },
    });
    const results = [];
    for (const post of candidates) {
      try { results.push(await this.publishPost(post.id, 'system')); } catch { results.push({ id: post.id, failed: true }); }
    }
    return results;
  }

  async retry(postId: string, actorId: string) {
    const post = await this.prisma.socialMediaPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Social post not found.');
    if (post.status !== SocialPostStatus.FAILED)
      throw new BadRequestException('Only failed posts can be retried.');
    if (post.attemptCount >= post.maxAttempts)
      throw new BadRequestException('Maximum retry attempts reached.');
    return this.publishPost(postId, actorId);
  }

  private validatePlatformContent(platform: SocialPlatform, title: string, caption: string) {
    if (/<script\b|javascript:/i.test(title + '\n' + caption)) throw new BadRequestException('Social content contains disallowed script content.');
    const limits: Record<SocialPlatform, number> = {
      [SocialPlatform.INSTAGRAM]: 2200,
      [SocialPlatform.FACEBOOK]: 63206,
      [SocialPlatform.YOUTUBE]: 5000,
    };
    if (title.length > 100) throw new BadRequestException('Social title exceeds the 100 character platform limit.');
    if (caption.length > limits[platform]) throw new BadRequestException('Social caption exceeds the selected platform limit.');
    const hashtagCount = (caption.match(/#[A-Za-z0-9_]+/g) || []).length;
    if (hashtagCount > 30) throw new BadRequestException('Too many hashtags in social caption.');
  }

  private async requireConsent(propertyId: string) {
    const consent = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId } });
    if (!consent?.approved) throw new BadRequestException('Owner marketing consent is required before preparing content.');
    return consent;
  }

  private async createPost(
    dto: PublishPostDto & { propertyId: string; actorId: string },
  ) {
    const consent = await this.prisma.socialMarketingConsent.findUnique({
      where: { propertyId: dto.propertyId },
    });
    if (!consent?.approved)
      throw new BadRequestException(
        'Owner marketing consent is required before publishing.',
      );
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { images: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!property) throw new NotFoundException('Property not found.');

    const templateData: PropertyVideoData = {
      title: property.title,
      description: property.description,
      price: property.price.toString(),
      city: property.city,
      locality: property.locality,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      propertyType: property.propertyType,
      furnishing: property.furnishing,
      parking: property.parking,
      petFriendly: property.petFriendly,
      address: property.address,
      imageUrls: property.images.map((image) => image.imageUrl).filter(Boolean),
    };
    const autoCaption = this.template.buildPlatformCaption(templateData, dto.platform);
    const autoTitle = this.template.buildTitle(templateData, dto.platform);
    this.validatePlatformContent(dto.platform as SocialPlatform, dto.title?.trim() || autoTitle, dto.caption?.trim() || autoCaption);
    const idempotencyKey = [dto.propertyId, dto.platform, consent.id, consent.preparedAt?.toISOString() || 'none'].join(':');
    const post = await this.prisma.socialMediaPost.upsert({
      where: { idempotencyKey },
      create: { propertyId: dto.propertyId, consentId: consent.id, platform: dto.platform as SocialPlatform, idempotencyKey, caption: dto.caption?.trim() || autoCaption },
      update: { caption: dto.caption?.trim() || autoCaption, consentId: consent.id },
    });
    // Keep the platform-specific generated title with the prepared content so
    // the publisher can use it immediately. Manual admin text still wins.
    await this.prisma.socialMarketingConsent.update({
      where: { propertyId: dto.propertyId },
      data: {
        preparedTitle: dto.title?.trim() || autoTitle,
        preparedCaption: dto.caption?.trim() || autoCaption,
      },
    });
    await this.audit(dto.propertyId, dto.actorId, 'POST_CREATED', post.id, {
      platform: dto.platform,
    });
    return post;
  }

  private async publishPost(postId: string, actorId: string) {
    const now = new Date();
    const processingToken = randomUUID();
    const claimed = await this.prisma.socialMediaPost.updateMany({
      where: { id: postId, attemptCount: { lt: 3 }, OR: [
        { status: { in: [SocialPostStatus.PENDING, SocialPostStatus.READY, SocialPostStatus.FAILED] }, processingLeaseUntil: null },
        { status: { in: [SocialPostStatus.PENDING, SocialPostStatus.READY, SocialPostStatus.FAILED] }, processingLeaseUntil: { lt: now } },
        { status: SocialPostStatus.PUBLISHING, processingLeaseUntil: { lt: now } },
      ] },
      data: { status: SocialPostStatus.PUBLISHING, attemptCount: { increment: 1 }, lastAttemptAt: now, nextRetryAt: null, processingToken, processingLeaseUntil: new Date(Date.now() + 10 * 60_000) },
    });
    if (claimed.count !== 1) {
      const current = await this.prisma.socialMediaPost.findUnique({ where: { id: postId } });
      if (current?.status === SocialPostStatus.PUBLISHED) return current;
      throw new BadRequestException('Social post is already being processed or is not eligible for publishing.');
    }
    const post = await this.prisma.socialMediaPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Social post not found.');
    let filePath: string | undefined;
    try {
      const consent = await this.prisma.socialMarketingConsent.findUnique({ where: { propertyId: post.propertyId } });
      if (!consent?.approved) throw new BadRequestException('Owner marketing consent has been revoked or is missing.');
      if (!consent.preparedVideoUrl) throw new BadRequestException('No prepared reel is available. Generate and review the reel before publishing.');
      try {
        if (post.platform === SocialPlatform.YOUTUBE) filePath = await this.storage.downloadVideo(consent.preparedVideoUrl, post.propertyId);
        const published = await this.publishing.publish(post.platform as any, { videoUrl: consent.preparedVideoUrl, filePath, caption: post.caption || consent.preparedCaption || '', title: consent.preparedTitle || 'RentItEase property tour' });
        const saved = await this.prisma.socialMediaPost.updateMany({ where: { id: postId, processingToken }, data: { status: SocialPostStatus.PUBLISHED, videoUrl: consent.preparedVideoUrl, externalId: published.externalId, publishedAt: new Date(), error: null, processingToken: null, processingLeaseUntil: null } });
        if (saved.count !== 1) throw new BadRequestException('Publication claim expired before completion.');
        const result = await this.prisma.socialMediaPost.findUnique({ where: { id: postId } });
        await this.audit(post.propertyId, actorId, 'POST_PUBLISHED', postId, { platform: post.platform, externalId: published.externalId });
        return result;
      } finally { await this.storage.cleanupTempFile(filePath); }
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Social provider failure.';
      const message = raw.replace(/https?:\/\/\S+/g, '[redacted-url]').slice(0, 500);
      const retryAt = post.attemptCount < post.maxAttempts ? new Date(Date.now() + Math.min(60 * 60_000, 2 ** post.attemptCount * 60_000)) : null;
      await this.prisma.socialMediaPost.updateMany({ where: { id: postId, processingToken }, data: { status: SocialPostStatus.FAILED, error: message, nextRetryAt: retryAt, processingToken: null, processingLeaseUntil: null } });
      await this.audit(post.propertyId, actorId, 'POST_FAILED', postId, { attemptCount: post.attemptCount, retryAt: retryAt?.toISOString(), message });
      throw new BadRequestException(post.platform + ' publish failed.');
    }
  }

  private audit(
    propertyId: string,
    actorId: string,
    eventType: string,
    postId?: string,
    details?: Record<string, unknown>,
  ) {
    const jsonDetails = details
      ? (JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue)
      : undefined;
    return this.prisma.socialMediaAuditEvent.create({
      data: { propertyId, actorId, postId, eventType, details: jsonDetails },
    });
  }
}
