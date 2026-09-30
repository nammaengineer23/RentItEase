import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  validateChatFileUpload,
  validateImageUpload,
} from '../../common/validators/upload-file.validator';
import { FileScanService } from '../../storage/file-scan.service';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly storageService: StorageService,
    private readonly fileScanService: FileScanService,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    await validateImageUpload(file);
    await this.fileScanService.scan(file);

    const uploadResult = await this.storageService.uploadImage(file, 'uploads/images');

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
      throw new BadRequestException('No file uploaded');
    }

    await validateChatFileUpload(file);
    await this.fileScanService.scan(file);

    const result = await this.storageService.uploadFile(
      file,
      'chat-attachments',
    );

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
