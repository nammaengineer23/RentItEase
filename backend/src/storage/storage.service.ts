import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FirebaseService } from '../firebase/firebase.service';
import { R2StorageService } from './r2-storage.service';
import { StoredImage } from './storage.types';

@Injectable()
export class StorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  uploadImage(
    file: Express.Multer.File,
    folder = 'properties',
  ): Promise<StoredImage> {
    if (this.driver === 'r2') {
      return this.r2StorageService.uploadImage(file, folder);
    }

    return this.firebaseService.uploadImage(file, folder);
  }

  async uploadPrivateFile(
    file: Express.Multer.File,
    folder = 'chat-attachments',
  ): Promise<{ publicId: string }> {
    if (this.driver === 'r2') {
      return this.r2StorageService.uploadPrivateFile(file, folder);
    }

    return this.firebaseService.uploadPrivateFile(file, folder);
  }

  uploadVideo(
    file: Express.Multer.File,
    folder = 'property-videos',
  ): Promise<StoredImage> {
    if (this.driver === 'r2') {
      return this.r2StorageService.uploadImage(file, folder);
    }

    return this.firebaseService.uploadImage(file, folder);
  }

  async getPrivateUrl(publicId: string, expiresInSeconds = 900): Promise<string> {
    if (publicId.startsWith('r2:')) {
      return this.r2StorageService.getSignedUrl(publicId, expiresInSeconds);
    }

    return this.firebaseService.getSignedDownloadUrl(publicId, expiresInSeconds);
  }

  async listObjects() {
    if (this.driver === 'r2') return this.r2StorageService.listObjects();
    return this.firebaseService.listObjects();
  }

  get driverName(): string { return this.driver; }

  deleteImage(publicId: string): Promise<boolean> {
    if (publicId.startsWith('r2:')) {
      return this.r2StorageService.deleteImage(publicId);
    }

    return this.firebaseService.deleteImage(publicId);
  }

  private get driver(): string {
    return (
      this.configService.get<string>('STORAGE_DRIVER')?.trim().toLowerCase() ??
      'firebase'
    );
  }
}
