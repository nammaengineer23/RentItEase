import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  memoryStorage,
} from 'multer';

import {
  extname,
} from 'path';

import {
  UploadsService,
} from './uploads.service';


@Controller('uploads')
export class UploadsController {

  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage: memoryStorage(),

        limits: {
          fileSize:
            5 * 1024 * 1024, // 5MB
        },
        fileFilter: (
          req,
          file,
          callback,
        ) => {
          const allowedExtensions =
            [
              '.jpg',
              '.jpeg',
              '.png',
              '.webp',
            ];

          const extension =
            extname(
              file.originalname,
            ).toLowerCase();

          if (
            allowedExtensions.includes(
              extension,
            )
          ) {
            callback(
              null,
              true,
            );
          } else {
            callback(
              new Error(
                'Only JPG, JPEG, PNG and WEBP files are allowed',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadImage(
      file,
    );
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowed = [
          '.pdf', '.doc', '.docx', '.txt',
          '.m4a', '.aac', '.mp3', '.wav', '.ogg',
        ];
        callback(
          allowed.includes(extname(file.originalname).toLowerCase())
            ? null
            : new Error('Unsupported chat file type.'),
          allowed.includes(extname(file.originalname).toLowerCase()),
        );
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file);
  }
}
