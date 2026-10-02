import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SocialAccountService } from '../accounts/social-account.service';
import { SocialProviderAmbiguousError } from './social-provider.errors';

@Injectable()
export class InstagramService {
  private readonly graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';
  constructor(private readonly accounts: SocialAccountService) {}

  private async request(url: string, body: URLSearchParams) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: controller.signal });
        const payload = await response.json().catch(() => ({})) as { id?: string };
        if (response.ok) return payload;
        if (response.status !== 429 && response.status < 500) throw new Error('Instagram provider rejected the request.');
        if (attempt === 3) throw new Error('Instagram provider unavailable.');
      } catch (error) {
        if (attempt === 3) throw new SocialProviderAmbiguousError('Instagram request may have reached the provider without a definitive response.');
      } finally { clearTimeout(timer); }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
    throw new Error('Instagram provider unavailable.');
  }

  async publish(params: { videoUrl: string; caption: string }): Promise<{ externalId: string; url?: string }> {
    const configuredToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const configuredId = process.env.INSTAGRAM_USER_ID;
    const credentials = await this.accounts.getCredentials('INSTAGRAM', { accessToken: configuredToken, accountId: configuredId });
    const accessToken = credentials.accessToken;
    const instagramUserId = credentials.accountId;
    if (!accessToken || !instagramUserId) throw new ServiceUnavailableException('Instagram publishing is not configured.');
    const base = 'https://graph.facebook.com/' + this.graphVersion;
    const creation = await this.request(base + '/' + instagramUserId + '/media', new URLSearchParams({ media_type: 'REELS', video_url: params.videoUrl, caption: params.caption, access_token: accessToken }));
    if (!creation.id) throw new Error('Instagram media container creation failed.');
    const published = await this.request(base + '/' + instagramUserId + '/media_publish', new URLSearchParams({ creation_id: creation.id, access_token: accessToken }));
    if (!published.id) throw new Error('Instagram media publish failed.');
    return { externalId: published.id };
  }
}
