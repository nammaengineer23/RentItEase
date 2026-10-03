import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ImageFileValidator } from '../../common/validators/image-file.validator';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const validator = new ImageFileValidator();
    if (!validator.isValid(file)) {
      throw new BadRequestException(validator.buildErrorMessage());
    }

    const uploadResult = await this.storageService.uploadImage(file);

    return {
      success: true,
      imageUrl: uploadResult.imageUrl,
      filename: uploadResult.publicId,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    conversationId: string,
    userId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!conversationId) {
      throw new BadRequestException('conversationId is required for chat attachments.');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, ownerId: true, tenantId: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found.');

    const isParticipant =
      conversation.ownerId === userId || conversation.tenantId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('You are not allowed to upload to this conversation.');
    }

    const result = await this.storageService.uploadPrivateFile(
      file,
      `chat/${conversationId}`,
    );

    return {
      success: true,
      fileUrl: `/api/v1/uploads/file?conversationId=${encodeURIComponent(conversationId)}&filename=${encodeURIComponent(result.publicId)}`,
      filename: result.publicId,
      conversationId,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async getChatAttachment(
    conversationId: string,
    filename: string,
    userId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, ownerId: true, tenantId: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found.');

    const isParticipant =
      conversation.ownerId === userId || conversation.tenantId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('You are not allowed to access this attachment.');
    }

    const expectedPrefix = `chat/${conversationId}/`;
    if (!filename.startsWith(expectedPrefix) || filename.includes('..')) {
      throw new ForbiddenException('Invalid chat attachment.');
    }

    const fileUrl = await this.storageService.getPrivateDownloadUrl(filename);
    return { success: true, fileUrl, filename, conversationId };
  }
}
