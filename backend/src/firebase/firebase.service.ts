import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';

import { getStorage } from 'firebase-admin/storage';

import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService {
  constructor(private readonly configService: ConfigService) {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService
            .get<string>('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n'),
        }),

        storageBucket: this.configService.get<string>(
          'FIREBASE_STORAGE_BUCKET',
        ),
      });

      console.log('✅ Firebase Admin initialized');
    }
  }

  // =====================================
  // Firebase Storage
  // =====================================

  getStorage() {
    return getStorage(getApp());
  }

  async uploadImage(file: Express.Multer.File, folder = 'properties') {
    const bucket = this.getStorage().bucket();

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    const firebaseFile = bucket.file(fileName);

    await this.withRetry(
      () =>
        this.withTimeout(
          firebaseFile.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          }),
          15_000,
        ),
      3,
      'Firebase Storage upload',
    );

    const imageUrl = await this.getPrivateDownloadUrl(fileName);

    return {
      publicId: fileName,
      imageUrl,
    };
  }

  async getPrivateDownloadUrl(
    publicId: string,
    expiresInMs = 15 * 60 * 1000,
  ): Promise<string> {
    const bucket = this.getStorage().bucket();
    const [url] = await this.withTimeout(
      bucket.file(publicId).getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInMs,
      }),
      15_000,
    );
    return url;
  }

  async deleteImage(publicId: string) {
    const bucket = this.getStorage().bucket();

    const file = bucket.file(publicId);

    await this.withRetry(
      () =>
        this.withTimeout(
          file.delete({ ignoreNotFound: true }),
          15_000,
        ),
      3,
      'Firebase Storage delete',
    );

    return true;
  }

  // =====================================
  // Firebase Auth
  // =====================================

  getAuth() {
    return getAuth();
  }

  async verifyToken(idToken: string) {
    return this.withTimeout(
      this.getAuth().verifyIdToken(idToken),
      15_000,
    );
  }

  // =====================================
  // Firebase Messaging
  // =====================================

  getMessaging() {
    return getMessaging();
  }

  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    return this.withRetry(
      () =>
        this.withTimeout(
          this.getMessaging().send({
            token,
            notification: { title, body },
            data,
          }),
          15_000,
        ),
      2,
      'FCM device notification',
    );
  }

  async sendToDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!tokens.length) {
      console.log('⚠️ No FCM tokens found.');
      return;
    }

    try {
      const response = await this.withRetry(
        () =>
          this.withTimeout(
            this.getMessaging().sendEachForMulticast({
              tokens,
              notification: { title, body },
              data,
            }),
            15_000,
          ),
        2,
        'FCM multicast notification',
      );

      return response;
    } catch (error) {
      console.error('❌ Firebase send failed:', error);
      throw error;
    }
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    operationName: string,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) {
          console.error(
            `Firebase operation failed: ${operationName}, attempts=${attempt}, type=${error instanceof Error ? error.name : 'unknown'}`,
          );
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }

    throw lastError;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Firebase operation timed out.'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
