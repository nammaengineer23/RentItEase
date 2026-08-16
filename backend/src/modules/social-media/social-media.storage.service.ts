import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

@Injectable()
export class SocialMediaStorageService {
  private ensureFirebase() {
    if (!getApps().length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Firebase Admin environment variables are required for video storage.');
      }

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }

  async uploadVideo(filePath: string, propertyId: string): Promise<string> {
    if (!existsSync(filePath)) throw new Error(`Generated video not found: ${filePath}`);

    this.ensureFirebase();
    const bucket = getStorage().bucket();
    const destination = `social-videos/${propertyId}/${Date.now()}.mp4`;
    const file = bucket.file(destination);

    await file.save(await import('node:fs/promises').then((fs) => fs.readFile(filePath)), {
      contentType: 'video/mp4',
      metadata: { cacheControl: 'public,max-age=3600' },
    });

    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destination).replace(/%2F/g, '/')}`;
  }
}
