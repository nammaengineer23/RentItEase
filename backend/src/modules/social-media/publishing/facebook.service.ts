import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SocialAccountService } from '../accounts/social-account.service';

@Injectable()
export class FacebookService {
  private readonly graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';
  constructor(private readonly accounts: SocialAccountService) {}

  async publish(params: { videoUrl: string; caption: string }): Promise<{ externalId: string; url?: string }> {
    const configuredToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const configuredId = process.env.FACEBOOK_PAGE_ID;
    const credentials = await this.accounts.getCredentials('FACEBOOK', { accessToken: configuredToken, accountId: configuredId });
    const accessToken = credentials.accessToken;
    const pageId = credentials.accountId;
    if (!accessToken || !pageId) throw new ServiceUnavailableException('Facebook publishing is not configured.');
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch('https://graph.facebook.com/' + this.graphVersion + '/' + pageId + '/videos', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ file_url: params.videoUrl, description: params.caption, access_token: accessToken }), signal: controller.signal });
        const result = await response.json().catch(() => ({})) as { id?: string };
        if (response.ok && result.id) return { externalId: result.id };
        if ((response.status !== 429 && response.status < 500) || attempt === 3) throw new Error('Facebook provider rejected the request.');
      } catch (error) {
        if (attempt === 3) throw error instanceof Error ? error : new Error('Facebook provider request failed.');
      } finally { clearTimeout(timer); }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
    throw new Error('Facebook provider unavailable.');
  }
}
