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

  uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ publicId: string }> {
    return this.firebaseService.uploadProfileImage(userId, file);
  }

  getProfileImageDownloadUrl(
    userId: string,
    objectKey: string,
    expiresInMs = 15 * 60 * 1000,
  ): Promise<string> {
    return this.firebaseService.getProfileImageDownloadUrl(
      userId,
      objectKey,
      expiresInMs,
    );
  }

  deleteProfileImage(userId: string, objectKey: string): Promise<boolean> {
    return this.firebaseService.deleteProfileImage(userId, objectKey);
  }

  deleteImage(publicId: string): Promise<boolean> {
    return this.firebaseService.deleteImage(publicId);
  }

  getPublicMediaDownloadUrl(
    publicId: string,
    expiresInMs = 60 * 60 * 1000,
  ): Promise<string> {
    return this.firebaseService.getPublicMediaDownloadUrl(
      publicId,
      expiresInMs,
    );
  }

  getPrivateDownloadUrl(
    publicId: string,
    expiresInMs = 15 * 60 * 1000,
  ): Promise<string> {
    return this.firebaseService.getPrivateDownloadUrl(publicId, expiresInMs);
  }
}
