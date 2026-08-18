import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name);
  async schedule(campaignId: string, publishAt: Date) { this.logger.log(`Scheduling ${campaignId} for ${publishAt.toISOString()}`); return { campaignId, publishAt, status: 'SCHEDULED' }; }
  async cancel(campaignId: string) { this.logger.log(`Cancelling ${campaignId}`); return { campaignId, status: 'CANCELLED' }; }
}
