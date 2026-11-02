import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';

import { getStorage, getDownloadURL } from 'firebase-admin/storage';

import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService {
  constructor(private readonly configService: ConfigService) {
    if (!getApps().length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      // Cloud Run uses its attached runtime service account through ADC.
      // Local development may continue to use an explicitly supplied key pair.
      const credential =
        clientEmail && privateKey
          ? cert({ projectId, clientEmail, privateKey })
          : applicationDefault();

      initializeApp({
        credential,
        projectId,
        storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
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

  private buildStorageObjectName(file: Express.Multer.File, folder: string): string {
    const allowedFolders = new Set(['properties', 'property-videos']);
    if (!allowedFolders.has(folder)) {
      throw new BadRequestException('Unsupported public storage folder.');
    }
    const extensionByMime: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
      'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/x-m4v': '.m4v',
    };
    const extension = extensionByMime[file.mimetype] ?? '.bin';
    return `${folder}/${randomUUID()}${extension}`;
  }

  async uploadImage(file: Express.Multer.File, folder = 'properties') {
    const bucket = this.getStorage().bucket();

    const fileName = this.buildStorageObjectName(file, folder);

    const firebaseFile = bucket.file(fileName);

    await this.withRetry(
      () =>
        this.withTimeout(
          firebaseFile.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
              cacheControl: 'public, max-age=3600',
            },
          }),
          15_000,
        ),
      3,
      'Firebase Storage upload',
    );

    const imageUrl = await this.withTimeout(getDownloadURL(firebaseFile), 15_000);

    return {
      publicId: fileName,
      imageUrl,
    };
  }

  async uploadPrivateFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ publicId: string }> {
    const bucket = this.getStorage().bucket();
    if (!/^chat\/[A-Za-z0-9_-]{1,128}$/.test(folder)) {
      throw new BadRequestException('Invalid private storage folder.');
    }
    const fileName = `${folder}/${randomUUID()}${this.safePrivateExtension(file.mimetype)}`;
    const firebaseFile = bucket.file(fileName);

    await this.withRetry(
      () =>
        this.withTimeout(
          firebaseFile.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
              cacheControl: 'private, no-store, max-age=0',
            },
          }),
          15_000,
        ),
      3,
      'Firebase private storage upload',
    );

    return { publicId: fileName };
  }

  private safePrivateExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'application/pdf': '.pdf', 'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt', 'audio/mp4': '.m4a', 'audio/aac': '.aac',
      'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/ogg': '.ogg',
    };
    return extensions[mimeType] ?? '.bin';
  }

  async getPrivateDownloadUrl(
    publicId: string,
    expiresInMs = 15 * 60 * 1000,
  ): Promise<string> {
    if (!/^chat\/[A-Za-z0-9_-]{1,128}\/[^/\\?#]+$/.test(publicId) || publicId.includes('..')) {
      throw new BadRequestException('Invalid private storage object key.');
    }
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
    if (!/^(properties|property-videos)\/[^/\\?#]+$/.test(publicId) || publicId.includes('..')) {
      throw new BadRequestException('Unsupported storage object key; legacy provider objects require a controlled migration.');
    }
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
    try {
      // checkRevoked=true also rejects revoked sessions and disabled Firebase users.
      // Firebase Admin validates the token against the configured project's audience.
      return await this.withTimeout(
        this.getAuth().verifyIdToken(idToken, true),
        15_000,
      );
    } catch {
      throw new UnauthorizedException('Invalid, expired, revoked, or disabled Firebase session.');
    }
  }

  private async getAppCheck() {
    // Lazy-load App Check Admin: its verifier pulls an ESM-only jose dependency,
    // which must not be loaded during unrelated CommonJS Jest test suites.
    const { getAppCheck } = await import('firebase-admin/app-check');
    return getAppCheck();
  }

  async verifyAppCheckToken(token: string): Promise<boolean> {
    try {
      const appCheck = await this.getAppCheck();
      await this.withTimeout(appCheck.verifyToken(token), 10_000);
      return true;
    } catch {
      return false;
    }
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
