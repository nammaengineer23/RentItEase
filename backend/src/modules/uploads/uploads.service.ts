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
    if (!validator.isValid(file) || !(await validator.hasValidContent(file))) {
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
    if (!this.hasValidAttachmentContent(file)) {
      throw new BadRequestException('The uploaded file content does not match an allowed attachment type.');
    }
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

  private hasValidAttachmentContent(file: Express.Multer.File): boolean {
    const b = file.buffer;
    if (!b?.length) return false;
    switch (file.mimetype) {
      case 'application/pdf': return b.subarray(0, 5).toString('ascii') === '%PDF-';
      case 'application/msword': return b.subarray(0, 8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return b.subarray(0, 4).equals(Buffer.from([0x50,0x4b,0x03,0x04]));
      case 'text/plain': return !b.includes(0) && b.toString('utf8').indexOf('\uFFFD') === -1;
      case 'audio/mp4': return b.length > 12 && b.subarray(4, 8).toString('ascii') === 'ftyp';
      case 'audio/aac': return b.length > 2 && b[0] === 0xff && (b[1] & 0xf6) === 0xf0;
      case 'audio/mpeg': return b.subarray(0, 3).toString('ascii') === 'ID3' || (b.length > 1 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
      case 'audio/wav': return b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WAVE';
      case 'audio/ogg': return b.subarray(0, 4).toString('ascii') === 'OggS';
      default: return false;
    }
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
