import sharp from 'sharp';

import {
  FileValidator,
} from '@nestjs/common';

export class ImageFileValidator extends FileValidator {
  constructor(
    private readonly maxSize: number = 5 * 1024 * 1024,
  ) {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) {
      return false;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    return (
      allowedTypes.includes(file.mimetype) &&
      file.size <= this.maxSize
    );
  }

  async hasValidContent(file?: Express.Multer.File): Promise<boolean> {
    if (!file?.buffer?.length) return false;
    try {
      const metadata = await sharp(file.buffer, { failOn: 'error' }).metadata();
      const expectedMime: Record<string, string> = {
        jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      };
      return Boolean(metadata.format && expectedMime[metadata.format] === file.mimetype);
    } catch {
      return false;
    }
  }

  buildErrorMessage(): string {
return 'Invalid image file. Only genuine JPG, JPEG, PNG and WEBP files under 5MB are allowed.';
  }
}