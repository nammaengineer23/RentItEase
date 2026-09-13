import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SocialMediaService } from '../social-media.service';

@Injectable()
export class CampaignSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignSchedulerService.name);
  private timer?: NodeJS.Timeout;
  private processing = false;

  constructor(private readonly socialMedia: SocialMediaService) {}

  onModuleInit() {
    if (process.env.SOCIAL_SCHEDULER_ENABLED !== 'true') return;
    this.timer = setInterval(() => void this.processDue(), 60_000);
    void this.processDue();
    this.logger.log('Persistent social-post scheduler enabled.');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
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
