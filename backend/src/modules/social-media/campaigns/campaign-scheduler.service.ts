import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SocialMediaService } from '../social-media.service';
import { SocialMediaStorageService } from '../social-media.storage.service';

@Injectable()
export class CampaignSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignSchedulerService.name);
  private timer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private processing = false;

  constructor(
    private readonly socialMedia: SocialMediaService,
    private readonly storage: SocialMediaStorageService,
  ) {}

  onModuleInit() {
    if (process.env.SOCIAL_SCHEDULER_ENABLED !== 'true') return;
    this.timer = setInterval(() => void this.processDue(), 60_000);
    this.cleanupTimer = setInterval(() => void this.cleanupVideos(), 24 * 60 * 60_000);
    void this.processDue();
    void this.cleanupVideos();
    this.logger.log('Persistent social-post scheduler enabled.');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  private async cleanupVideos() {
    try {
      const retentionDays = Number(process.env.SOCIAL_VIDEO_RETENTION_DAYS || 30);
      const result = await this.storage.cleanupUnreferencedVideos(retentionDays);
      if (result.deleted) this.logger.log(`Cleaned up ${result.deleted} orphan social video(s).`);
    } catch (error) {
      this.logger.error('Unable to clean up orphan social videos.', error instanceof Error ? error.stack : undefined);
    }
  }

  private async processDue() {
    if (this.processing) return;
    this.processing = true;
    try {
      const results = await this.socialMedia.processDuePosts();
      if (results.length) this.logger.log(`Processed ${results.length} due social post(s).`);
    } catch (error) {
      this.logger.error('Unable to process due social posts.', error instanceof Error ? error.stack : undefined);
    } finally {
      this.processing = false;
    }
  }
}
