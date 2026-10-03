import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const extension = extname(file.originalname).toLowerCase();
        callback(
          allowedExtensions.includes(extension)
            ? null
            : new Error('Only JPG, JPEG, PNG and WEBP files are allowed'),
          allowedExtensions.includes(extension),
        );
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadImage(file);
  }

  @Post('file')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowed = [
          '.pdf', '.doc', '.docx', '.txt',
          '.m4a', '.aac', '.mp3', '.wav', '.ogg',
        ];
        const extension = extname(file.originalname).toLowerCase();
        callback(
          allowed.includes(extension) ? null : new Error('Unsupported chat file type.'),
          allowed.includes(extension),
        );
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file);
  }
}
