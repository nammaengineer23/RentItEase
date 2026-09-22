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

  uploadVideo(
    file: Express.Multer.File,
    folder = 'property-videos',
  ): Promise<StoredImage> {
    // Both storage drivers preserve the supplied MIME type and raw bytes.
    // Keep a separate video entry point so video uploads do not depend on
    // image-specific behavior as the storage layer evolves.
    if (this.driver === 'r2') {
      return this.r2StorageService.uploadImage(file, folder);
    }

    return this.firebaseService.uploadImage(file, folder);
  }

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
