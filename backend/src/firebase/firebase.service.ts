import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';

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

  async deleteImage(publicId: string) {
    const bucket = this.getStorage().bucket();

    const file = bucket.file(publicId);

    await file.delete({
      ignoreNotFound: true,
    });

    return true;
  }

  // =====================================
  // Firebase Auth
  // =====================================

  getAuth() {
    return getAuth();
  }

  async verifyToken(idToken: string) {
    return this.getAuth().verifyIdToken(idToken);
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
