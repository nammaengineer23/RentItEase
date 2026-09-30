import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

@Injectable()
export class SocialMediaStorageService {
  private ensureFirebase() {
    if (!getApps().length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) throw new Error('Firebase Admin environment variables are required for video storage.');
      initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }), storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
    }
  }

  private isBlockedIp(ip: string) {
    if (isIP(ip) === 4) {
      const p = ip.split('.').map(Number);
      return p[0] === 10 || p[0] === 127 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || p[0] === 0;
    }
    if (isIP(ip) === 6) return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:') || ip === '::';
    return true;
  }

  private async validateRemoteUrl(raw: string) {
    let url: URL;
    try { url = new URL(raw); } catch { throw new Error('Video source URL is invalid.'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Video source URL must use HTTPS without credentials.');
    const configured = (process.env.SOCIAL_VIDEO_SOURCE_HOSTS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
    const allowed = new Set(['storage.googleapis.com', ...configured]);
    try {
      const renderHost = process.env.REMOTION_RENDER_URL ? new URL(process.env.REMOTION_RENDER_URL).hostname.toLowerCase() : '';
      if (renderHost) allowed.add(renderHost);
    } catch { /* renderer URL validation is handled by the renderer service */ }
    if (!allowed.has(url.hostname.toLowerCase())) throw new Error('Video source host is not allowed.');
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some((entry) => this.isBlockedIp(entry.address))) throw new Error('Video source resolves to a blocked network address.');
    return url;
  }

  private async fetchRemoteVideo(rawUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
    let current = await this.validateRemoteUrl(rawUrl);
    for (let redirect = 0; redirect <= 2; redirect += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(current, { signal: controller.signal, redirect: 'manual' });
        if ([301,302,303,307,308].includes(response.status)) {
          const location = response.headers.get('location');
          if (!location || redirect === 2) throw new Error('Too many video redirects.');
          current = await this.validateRemoteUrl(new URL(location, current).toString());
          continue;
        }
        if (!response.ok) throw new Error('Unable to download remote video.');
        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > MAX_VIDEO_BYTES) throw new Error('Remote video exceeds the 100 MB limit.');
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > MAX_VIDEO_BYTES) throw new Error('Remote video exceeds the 100 MB limit.');
        const contentType = (response.headers.get('content-type') || 'video/mp4').split(';')[0].toLowerCase();
        if (!contentType.startsWith('video/')) throw new Error('Remote source is not a video.');
        return { buffer, contentType };
      } finally { clearTimeout(timer); }
    }
    throw new Error('Unable to download remote video.');
  }

  async downloadVideo(videoUrl: string, propertyId: string): Promise<string> {
    const { buffer } = await this.fetchRemoteVideo(videoUrl);
    const filePath = join(tmpdir(), 'rentitease-social-' + propertyId + '-' + Date.now() + '.mp4');
    await import('node:fs/promises').then((fs) => fs.writeFile(filePath, buffer));
    return filePath;
  }

  async cleanupTempFile(filePath: string | undefined) {
    if (!filePath) return;
    try { await unlink(filePath); } catch { /* already removed */ }
  }

  async importRemoteVideo(videoUrl: string, propertyId: string): Promise<string> {
    const { buffer, contentType } = await this.fetchRemoteVideo(videoUrl);
    return this.uploadBuffer(buffer, propertyId, contentType);
  }

  async uploadBuffer(buffer: Buffer, propertyId: string, contentType = 'video/mp4'): Promise<string> {
    if (buffer.length > MAX_VIDEO_BYTES) throw new Error('Video exceeds the 100 MB storage limit.');
    this.ensureFirebase();
    const bucket = getStorage().bucket();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const destination = 'social-videos/' + propertyId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.mp4';
        const file = bucket.file(destination);
        await file.save(buffer, { contentType, metadata: { cacheControl: 'public,max-age=3600' } });
        await file.makePublic();
        return 'https://storage.googleapis.com/' + bucket.name + '/' + encodeURIComponent(destination).replace(/%2F/g, '/');
      } catch (error) {
        if (attempt === 3) throw new Error('Video storage operation failed.');
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
    throw new Error('Video storage operation failed.');
  }

  async uploadVideo(filePath: string, propertyId: string): Promise<string> {
    if (!existsSync(filePath)) throw new Error('Generated video not found.');
    const buffer = await readFile(filePath);
    return this.uploadBuffer(buffer, propertyId, 'video/mp4');
  }
}