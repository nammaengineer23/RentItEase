import { apiRequest } from './http';

export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';

export interface GenerateVideoResponse {
  propertyId: string;
  title: string;
  filePath: string;
  durationSeconds: number;
  caption: string;
  videoTitle: string;
  videoUrl?: string;
}

export interface SocialSettings {
  mode: 'DISABLED' | 'GENERATE_ONLY' | 'AUTO_PUBLISH' | string;
  instagramEnabled: boolean;
  facebookEnabled: boolean;
  youtubeEnabled: boolean;
  defaultTemplate: string;
}

export interface ConsentedProperty {
  id: string;
  title: string;
  city: string;
  price: number | string;
  images: Array<{ imageUrl: string }>;
  owner: { fullName: string };
  socialMarketingConsent: {
    approved: boolean;
    autoPublish: boolean;
    platforms: SocialPlatform[];
    consentVersion: string;
    consentedAt?: string;
  };
}

interface ApiDataResponse<T> {
  data: T;
}

async function socialRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await apiRequest<T | ApiDataResponse<T>>(path, options);
  return typeof response === 'object' && response !== null && 'data' in response
    ? (response as ApiDataResponse<T>).data
    : (response as T);
}

export const socialMediaApi = {
  settings: () => socialRequest<SocialSettings>('/admin/social-media/settings'),

  properties: () =>
    socialRequest<ConsentedProperty[]>('/admin/social-media/properties'),

  generate: (propertyId: string, secondsPerPhoto = 3) =>
    socialRequest<GenerateVideoResponse>('/admin/social-media/generate', {
      method: 'POST',
      body: JSON.stringify({
        propertyId,
        secondsPerPhoto,
      }),
    }),

  publish: (
    propertyId: string,
    platform: SocialPlatform,
    caption?: string,
    title?: string,
  ) =>
    socialRequest<{ externalId: string; url?: string }>(
      `/admin/social-media/properties/${propertyId}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({ platform, caption, title }),
      },
    ),

  processApproved: (propertyId: string) =>
    socialRequest<{
      skipped?: boolean;
      reason?: string;
      publications?: Array<{
        platform: string;
        success: boolean;
        externalId?: string;
        error?: string;
      }>;
    }>(`/admin/social-media/properties/${propertyId}/approved`, {
      method: 'POST',
    }),
};
