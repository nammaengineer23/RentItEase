import { Injectable } from '@nestjs/common';

@Injectable()
export class InstagramService {
  private readonly graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';

  async publish(params: { videoUrl: string; caption: string }): Promise<{ externalId: string; url?: string }> {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramUserId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !instagramUserId) {
      throw new Error('Instagram publishing is not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID.');
    }

    const base = `https://graph.facebook.com/${this.graphVersion}`;
    const createResponse = await fetch(`${base}/${instagramUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type: 'REELS',
        video_url: params.videoUrl,
        caption: params.caption,
        access_token: accessToken,
      }),
    });

    const creation = await createResponse.json() as { id?: string; error?: { message?: string } };
    if (!createResponse.ok || !creation.id) {
      throw new Error(creation.error?.message || 'Instagram media container creation failed.');
    }

    const publishResponse = await fetch(`${base}/${instagramUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: creation.id,
        access_token: accessToken,
      }),
    });

    const published = await publishResponse.json() as { id?: string; error?: { message?: string } };
    if (!publishResponse.ok || !published.id) {
      throw new Error(published.error?.message || 'Instagram media publish failed.');
    }

    return { externalId: published.id };
  }
}
