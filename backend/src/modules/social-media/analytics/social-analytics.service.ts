import { Injectable } from '@nestjs/common';
@Injectable()
export class SocialAnalyticsService {
  summarize(posts: Array<{ platform: string; impressions?: number; clicks?: number; likes?: number; shares?: number; leads?: number }>) {
    return posts.reduce((a, p) => ({ impressions: a.impressions + (p.impressions || 0), clicks: a.clicks + (p.clicks || 0), likes: a.likes + (p.likes || 0), shares: a.shares + (p.shares || 0), leads: a.leads + (p.leads || 0), platforms: [...a.platforms, p.platform] }), { impressions: 0, clicks: 0, likes: 0, shares: 0, leads: 0, platforms: [] as string[] });
  }
}
