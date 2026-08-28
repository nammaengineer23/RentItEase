import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { ImageFileValidator } from '../../common/validators/image-file.validator';
import { StorageService } from '../../storage/storage.service';


@Injectable()
export class UploadsService {

 constructor(
    private readonly storageService: StorageService,
  ) {}


  async uploadImage(
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded',
      );
    }

    const validator =
      new ImageFileValidator();

    if (!validator.isValid(file)) {
      throw new BadRequestException(
        validator.buildErrorMessage(),
      );
    }

    const uploadResult =
  await this.storageService.uploadImage(file);

return {
  success: true,
  imageUrl: uploadResult.imageUrl,
  filename: uploadResult.publicId,
  originalName: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
};
  }
}