import { PrismaClient, SocialPlatform, SocialPostStatus } from '@prisma/client';
import { google } from 'googleapis';

const prisma = new PrismaClient();

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';
const graph = (path: string) => `https://graph.facebook.com/${graphVersion}${path}`;

async function getJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Provider request failed ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);
  return body as Record<string, any>;
}

async function verifyInstagram() {
  const token = required('INSTAGRAM_ACCESS_TOKEN');
  const accountId = required('INSTAGRAM_USER_ID');
  const account = await getJson(graph(`/${accountId}?fields=id,username,account_type&access_token=${encodeURIComponent(token)}`));
  const ambiguousId = process.env.INSTAGRAM_AMBIGUOUS_EXTERNAL_ID;
  const ambiguous = ambiguousId
    ? await getJson(graph(`/${ambiguousId}?fields=id,media_type,permalink&access_token=${encodeURIComponent(token)}`))
    : null;
  if (process.env.SOCIAL_VERIFY_REFRESH === 'true') {
    await getJson(`${graph('/refresh_access_token')}?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
  }
  return { account, ambiguous };
}

async function verifyFacebook() {
  const token = required('FACEBOOK_PAGE_ACCESS_TOKEN');
  const pageId = required('FACEBOOK_PAGE_ID');
  const account = await getJson(graph(`/${pageId}?fields=id,name&access_token=${encodeURIComponent(token)}`));
  const ambiguousId = process.env.FACEBOOK_AMBIGUOUS_EXTERNAL_ID;
  const ambiguous = ambiguousId
    ? await getJson(graph(`/${ambiguousId}?fields=id,permalink&access_token=${encodeURIComponent(token)}`))
    : null;
  if (process.env.SOCIAL_VERIFY_REFRESH === 'true' && process.env.META_APP_ID && process.env.META_APP_SECRET) {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: token,
    });
    await getJson(graph('/oauth/access_token') + '?' + params.toString());
  }
  return { account, ambiguous };
}

async function verifyYouTube() {
  const clientId = required('YOUTUBE_CLIENT_ID');
  const clientSecret = required('YOUTUBE_CLIENT_SECRET');
  const refreshToken = required('YOUTUBE_REFRESH_TOKEN');
  const oauth = new google.auth.OAuth2(clientId, clientSecret, process.env.YOUTUBE_REDIRECT_URI);
  oauth.setCredentials({ refresh_token: refreshToken });
  const token = await oauth.getAccessToken();
  if (!token.token) throw new Error('YouTube OAuth refresh did not return an access token.');
  const youtube = google.youtube({ version: 'v3', auth: oauth });
  const channel = await youtube.channels.list({ part: ['id', 'snippet'], mine: true });
  if (!channel.data.items?.[0]?.id) throw new Error('YouTube OAuth account verification returned no channel.');
  const ambiguousId = process.env.YOUTUBE_AMBIGUOUS_EXTERNAL_ID;
  const ambiguous = ambiguousId
    ? await youtube.videos.list({ part: ['id', 'snippet', 'status'], id: [ambiguousId] })
    : null;
  return { channel: channel.data.items[0], ambiguous };
}

async function syncAnalytics() {
  const posts = await prisma.socialMediaPost.findMany({
    where: { status: SocialPostStatus.PUBLISHED, externalId: { not: null } },
    select: { id: true, platform: true, externalId: true },
    take: 1000,
  });
  let synced = 0;
  for (const post of posts) {
    if (!post.externalId) continue;
    let metrics = { impressions: 0, clicks: 0, likes: 0, shares: 0, leads: 0 };
    if (post.platform === SocialPlatform.YOUTUBE) {
      const oauth = new google.auth.OAuth2(required('YOUTUBE_CLIENT_ID'), required('YOUTUBE_CLIENT_SECRET'), process.env.YOUTUBE_REDIRECT_URI);
      oauth.setCredentials({ refresh_token: required('YOUTUBE_REFRESH_TOKEN') });
      const youtube = google.youtube({ version: 'v3', auth: oauth });
      const result = await youtube.videos.list({ part: ['statistics'], id: [post.externalId] });
      const s = result.data.items?.[0]?.statistics;
      metrics.likes = Number(s?.likeCount || 0);
      metrics.shares = Number(s?.shareCount || 0);
      metrics.clicks = Number(s?.commentCount || 0);
      metrics.impressions = Number(s?.viewCount || 0);
    } else if (post.platform === SocialPlatform.INSTAGRAM) {
      const token = required('INSTAGRAM_ACCESS_TOKEN');
      const result = await getJson(graph(`/${post.externalId}/insights?metric=impressions,likes,shares,saved&access_token=${encodeURIComponent(token)}`));
      for (const item of result.data || []) metrics[item.name === 'saved' ? 'clicks' : item.name as keyof typeof metrics] = Number(item.values?.[0]?.value || 0);
    } else if (post.platform === SocialPlatform.FACEBOOK) {
      const token = required('FACEBOOK_PAGE_ACCESS_TOKEN');
      const result = await getJson(graph(`/${post.externalId}/insights?metric=post_impressions,post_clicks,post_reactions_by_type_total&access_token=${encodeURIComponent(token)}`));
      for (const item of result.data || []) {
        const value = Number(item.values?.[0]?.value || 0);
        if (item.name === 'post_impressions') metrics.impressions = value;
        if (item.name === 'post_clicks') metrics.clicks = value;
        if (item.name === 'post_reactions_by_type_total') metrics.likes = value;
      }
    }
    await prisma.socialAnalyticsSnapshot.create({ data: { postId: post.id, platform: post.platform, ...metrics } });
    synced++;
  }
  return { scanned: posts.length, synced };
}

async function concurrencyTest() {
  const postId = required('SOCIAL_LIVE_TEST_POST_ID');
  const workers = Number(process.env.SOCIAL_CONCURRENCY_WORKERS || 20);
  const post = await prisma.socialMediaPost.findUnique({ where: { id: postId }, select: { id: true, status: true, attemptCount: true, maxAttempts: true } });
  if (!post) throw new Error('SOCIAL_LIVE_TEST_POST_ID does not exist.');
  if (post.attemptCount >= post.maxAttempts) throw new Error('Live concurrency test post has exhausted attempts.');
  await prisma.socialMediaPost.update({ where: { id: postId }, data: { status: SocialPostStatus.READY, processingToken: null, processingLeaseUntil: null, nextRetryAt: null } });
  const now = new Date();
  const results = await Promise.all(Array.from({ length: workers }, async (_, index) => {
    const token = `live-concurrency-${Date.now()}-${index}`;
    const result = await prisma.socialMediaPost.updateMany({
      where: { id: postId, attemptCount: { lt: post!.maxAttempts }, status: { in: [SocialPostStatus.READY, SocialPostStatus.PENDING] }, processingLeaseUntil: null },
      data: { status: SocialPostStatus.PUBLISHING, processingToken: token, processingLeaseUntil: new Date(now.getTime() + 60_000), attemptCount: { increment: 1 } },
    });
    return result.count;
  }));
  const winners = results.reduce((a, b) => a + b, 0);
  await prisma.socialMediaPost.update({ where: { id: postId }, data: { status: SocialPostStatus.READY, processingToken: null, processingLeaseUntil: null, nextRetryAt: null } });
  if (winners !== 1) throw new Error(`Concurrency fencing failed: expected exactly 1 winner, got ${winners}.`);
  return { workers, winners };
}

async function main() {
  const result: Record<string, any> = {};
  result.instagram = await verifyInstagram();
  result.facebook = await verifyFacebook();
  result.youtube = await verifyYouTube();
  result.analytics = await syncAnalytics();
  result.concurrency = await concurrencyTest();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
