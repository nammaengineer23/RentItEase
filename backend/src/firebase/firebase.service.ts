import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { randomUUID } from 'crypto';

import { getStorage, getDownloadURL } from 'firebase-admin/storage';

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

  getStorage() {
    return getStorage(getApp());
  }

  private buildStorageFileName(file: Express.Multer.File, folder: string): string {
    const safeFolder = folder
      .split('/')
      .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean)
      .join('/') || 'uploads';
    const safeName = file.originalname
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[.-]+/, '')
      .slice(-120) || 'upload';

    return `${safeFolder}/${randomUUID()}-${safeName}`;
  }

  async uploadImage(file: Express.Multer.File, folder = 'properties') {
    const bucket = this.getStorage().bucket();
    const fileName = this.buildStorageFileName(file, folder);
    const firebaseFile = bucket.file(fileName);

    await firebaseFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const imageUrl = await getDownloadURL(firebaseFile);

    return {
      publicId: fileName,
      imageUrl,
    };
  }

  async uploadPrivateFile(
    file: Express.Multer.File,
    folder = 'chat-attachments',
  ): Promise<{ publicId: string }> {
    const bucket = this.getStorage().bucket();
    const fileName = this.buildStorageFileName(file, folder);
    const firebaseFile = bucket.file(fileName);

    await firebaseFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    return { publicId: fileName };
  }

  async listObjects(): Promise<Array<{ publicId: string; createdAt: Date }>> {
    const [files] = await this.getStorage().bucket().getFiles({
      prefix: 'properties/',
    });
    const [videos] = await this.getStorage().bucket().getFiles({
      prefix: 'property-videos/',
    });
    const [attachments] = await this.getStorage().bucket().getFiles({
      prefix: 'chat-attachments/',
    });

    return [...files, ...videos, ...attachments]
      .filter((file) => file.metadata.name && file.metadata.timeCreated)
      .map((file) => ({
        publicId: file.name,
        createdAt: new Date(file.metadata.timeCreated as string),
      }));
  }

  async getSignedDownloadUrl(publicId: string, expiresInSeconds = 900): Promise<string> {
    const bucket = this.getStorage().bucket();
    const [url] = await bucket.file(publicId).getSignedUrl({
      action: 'read',
      expires: Date.now() + Math.min(Math.max(Math.floor(expiresInSeconds), 60), 3600) * 1000,
    });
    return url;
  }

  async deleteImage(publicId: string) {
    const bucket = this.getStorage().bucket();

    const file = bucket.file(publicId);

    await file.delete({
      ignoreNotFound: true,
    });

    return true;
  }

  getAuth() {
    return getAuth();
  }

  async verifyToken(idToken: string) {
    return this.getAuth().verifyIdToken(idToken);
  }

  getMessaging() {
    return getMessaging();
  }

  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    return this.getMessaging().send({
      token,
      notification: {
        title,
        body,
      },
      data,
    });
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
      const response =
        await this.getMessaging().sendEachForMulticast({
          tokens,
          notification: {
            title,
            body,
          },
          data,
        });

      return response;
    } catch (error) {
      console.error(
        '❌ Firebase send failed:',
        error,
      );
      throw error;
    }
  }
}
