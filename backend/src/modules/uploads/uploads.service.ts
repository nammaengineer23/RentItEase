import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  validateChatFileContent,
  validateImageContent,
} from '../../common/validators/upload-content.validator';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class UploadsService {
  constructor(private readonly storageService: StorageService) {}

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must not exceed 5 MB.');
    }

    await validateImageContent(file);

    const uploadResult = await this.storageService.uploadImage(file, 'uploads');

    return {
      success: true,
      imageUrl: uploadResult.imageUrl,
      filename: uploadResult.publicId,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new BadRequestException('File must not exceed 15 MB.');
    }

    await validateChatFileContent(file);

    const result = await this.storageService.uploadImage(file, 'chat');

    return {
      success: true,
      fileUrl: result.imageUrl,
      filename: result.publicId,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
