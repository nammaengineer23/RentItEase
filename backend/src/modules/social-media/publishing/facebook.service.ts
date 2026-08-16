import { Injectable } from '@nestjs/common';

@Injectable()
export class FacebookService {
  private readonly graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';

  async publish(params: { videoUrl: string; caption: string }): Promise<{ externalId: string; url?: string }> {
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!accessToken || !pageId) {
      throw new Error('Facebook publishing is not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID.');
    }

    const base = `https://graph.facebook.com/${this.graphVersion}`;
    const response = await fetch(`${base}/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        file_url: params.videoUrl,
        description: params.caption,
        access_token: accessToken,
      }),
    });

    const result = await response.json() as { id?: string; error?: { message?: string } };
    if (!response.ok || !result.id) {
      throw new Error(result.error?.message || 'Facebook video publish failed.');
    }

    return { externalId: result.id };
  }
}
