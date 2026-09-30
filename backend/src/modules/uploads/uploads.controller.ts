import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];
        const extension = extname(file.originalname).toLowerCase();

        const valid =
          allowedExtensions.includes(extension) &&
          allowedMimeTypes.includes(file.mimetype);

        callback(
          valid
            ? null
            : new Error('Only JPEG, PNG and WEBP images are allowed.'),
          valid,
        );
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadImage(file);
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
      fileFilter: (_request, file, callback) => {
        const allowed = new Map([
          ['.pdf', 'application/pdf'],
          ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          ['.txt', 'text/plain'],
          ['.m4a', 'audio/mp4'],
          ['.aac', 'audio/aac'],
          ['.mp3', 'audio/mpeg'],
          ['.wav', 'audio/wav'],
          ['.ogg', 'audio/ogg'],
        ]);
        const extension = extname(file.originalname).toLowerCase();
        const expectedMime = allowed.get(extension);
        const valid = Boolean(expectedMime && expectedMime === file.mimetype);

        callback(
          valid ? null : new Error('Unsupported attachment type.'),
          valid,
        );
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadFile(file);
  }
}
