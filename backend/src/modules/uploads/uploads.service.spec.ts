import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UploadsService } from './uploads.service';

describe('UploadsService storage authorization', () => {
  const conversation = { id: 'conversation-1', ownerId: 'owner-1', tenantId: 'tenant-1' };
  const prisma = {
    conversation: { findUnique: jest.fn() },
    message: { findFirst: jest.fn() },
  } as any;
  const storage = {
    uploadImage: jest.fn(),
    uploadPrivateFile: jest.fn(),
    getPrivateDownloadUrl: jest.fn(),
  } as any;
  let service: UploadsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UploadsService(storage, prisma);
    prisma.conversation.findUnique.mockResolvedValue(conversation);
  });

  it('rejects image content that does not match its claimed MIME type', async () => {
    await expect(service.uploadImage({
      buffer: Buffer.from('not an image'),
      mimetype: 'image/png',
      size: 12,
      originalname: 'fake.png',
    } as Express.Multer.File)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('requires the uploader to be a conversation participant', async () => {
    await expect(service.uploadFile({
      buffer: Buffer.from('%PDF-1.7'),
      mimetype: 'application/pdf',
      size: 8,
      originalname: 'file.pdf',
    } as Express.Multer.File, 'conversation-1', 'outsider'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.uploadPrivateFile).not.toHaveBeenCalled();
  });

  it('does not sign a guessed object unless a live message references it', async () => {
    prisma.message.findFirst.mockResolvedValue(null);
    await expect(service.getChatAttachment(
      'conversation-1', 'chat/conversation-1/opaque.pdf', 'owner-1',
    )).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.getPrivateDownloadUrl).not.toHaveBeenCalled();
  });

  it('returns a short-lived URL only for an attachment on a live message', async () => {
    prisma.message.findFirst.mockResolvedValue({ id: 'message-1' });
    storage.getPrivateDownloadUrl.mockResolvedValue('https://signed.example/file');
    await expect(service.getChatAttachment(
      'conversation-1', 'chat/conversation-1/opaque.pdf', 'tenant-1',
    )).resolves.toEqual({
      success: true,
      fileUrl: 'https://signed.example/file',
      filename: 'chat/conversation-1/opaque.pdf',
      conversationId: 'conversation-1',
    });
    expect(prisma.message.findFirst).toHaveBeenCalledWith({
      where: { conversationId: 'conversation-1', attachmentPublicId: 'chat/conversation-1/opaque.pdf', deletedAt: null },
      select: { id: true },
    });
  });
});
