import { Injectable } from '@nestjs/common';
export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';
@Injectable()
export class SocialAccountService {
  getConnectionState() { return { instagram: { connected: false, configured: Boolean(process.env.META_APP_ID) }, facebook: { connected: false, configured: Boolean(process.env.META_APP_ID) }, youtube: { connected: false, configured: Boolean(process.env.GOOGLE_CLIENT_ID) } }; }
  getOAuthConfig(platform: SocialPlatform) { return platform === 'YOUTUBE' ? { clientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID) } : { appIdConfigured: Boolean(process.env.META_APP_ID) }; }
}
