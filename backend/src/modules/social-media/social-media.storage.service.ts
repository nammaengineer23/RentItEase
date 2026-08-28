import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { StorageService } from '../../storage/storage.service';

@Injectable()
export class SocialMediaStorageService {
  constructor(private readonly storage: StorageService) {}

  async uploadVideo(filePath: string, propertyId: string): Promise<string> {
    const buffer = await readFile(filePath);
    const file = {
      buffer,
      originalname: basename(filePath),
      mimetype: 'video/mp4',
      size: buffer.length,
    } as Express.Multer.File;

    const stored = await this.storage.uploadImage(
      file,
      `social-videos/${propertyId}`,
    );

    return stored.imageUrl;
  }
}
