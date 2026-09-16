const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error || `Request failed (${response.status})`);
  return (body?.data ?? body) as T;
}

export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';
export interface GenerateVideoResponse { propertyId: string; title: string; filePath: string; durationSeconds: number; caption: string; videoTitle: string; videoUrl?: string; }
export interface SocialSettings { mode: 'DISABLED' | 'GENERATE_ONLY' | string; instagramEnabled: boolean; facebookEnabled: boolean; youtubeEnabled: boolean; defaultTemplate: string; }
export interface SocialProperty { id: string; title: string; city: string; locality?: string | null; createdAt: string; owner: { id: string; fullName: string }; socialMarketingConsent: { id: string; approved: boolean; consentVersion: string; consentedAt: string }; images: Array<{ id: string; imageUrl: string }>; }
export interface SocialAnalytics { totalPosts: number; published: number; failed: number; pending: number; scheduled: number; instagram: number; facebook: number; youtube: number; engagement: { impressions: number; clicks: number; likes: number; shares: number; leads: number }; }

export const socialMediaApi = {
  settings: () => request<SocialSettings>('/admin/social-media/settings'),
  properties: () => request<SocialProperty[]>('/admin/social-media/properties'),
  analytics: () => request<SocialAnalytics>('/admin/social-media/analytics'),
  generate: (propertyId: string, secondsPerPhoto = 3) => request<GenerateVideoResponse>('/admin/social-media/generate', { method: 'POST', body: JSON.stringify({ propertyId, secondsPerPhoto }) }),
  publish: (propertyId: string, platform: SocialPlatform, caption?: string, title?: string) => request<{ externalId: string; url?: string }>(`/admin/social-media/properties/${propertyId}/publish`, { method: 'POST', body: JSON.stringify({ platform, caption, title }) }),
  schedule: (propertyId: string, platform: SocialPlatform, scheduledAt: string, caption?: string, title?: string) => request<{ id: string; scheduledAt: string }>(`/admin/social-media/properties/${propertyId}/schedule`, { method: 'POST', body: JSON.stringify({ platform, scheduledAt, caption, title }) }),
  retry: (postId: string) => request(`/admin/social-media/posts/${postId}/retry`, { method: 'POST' }),
  processApproved: (propertyId: string) => request<{ skipped?: boolean; reason?: string; publications?: Array<{ platform: string; success: boolean; externalId?: string; error?: string }> }>(`/admin/social-media/properties/${propertyId}/approved`, { method: 'POST' }),
};
