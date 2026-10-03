import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { StoredImage } from './storage.types';

@Injectable()
export class StorageService {
  constructor(private readonly firebaseService: FirebaseService) {}

  uploadImage(
    file: Express.Multer.File,
    folder = 'properties',
  ): Promise<StoredImage> {
    return this.firebaseService.uploadImage(file, folder);
  }

  uploadVideo(
    file: Express.Multer.File,
    folder = 'property-videos',
  ): Promise<StoredImage> {
    return this.firebaseService.uploadImage(file, folder);
  }

  uploadPrivateFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ publicId: string }> {
    return this.firebaseService.uploadPrivateFile(file, folder);
  }

  deleteImage(publicId: string): Promise<boolean> {
    return this.firebaseService.deleteImage(publicId);
  }

  getPrivateDownloadUrl(
    publicId: string,
    expiresInMs = 15 * 60 * 1000,
  ): Promise<string> {
    return this.firebaseService.getPrivateDownloadUrl(publicId, expiresInMs);
  }
}
