import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import {
  MessageType,
  NotificationType,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FileScanService } from '../../storage/file-scan.service';
import { StorageService } from '../../storage/storage.service';
import { validateChatFileUpload } from '../../common/validators/upload-file.validator';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly storageService: StorageService,
    private readonly fileScanService: FileScanService,
  ) {}

  async createConversation(propertyId: string, tenantId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) throw new NotFoundException('Property not found.');

    if (property.ownerId === tenantId) {
      throw new BadRequestException(
        'Open Chat to reply to tenant conversations for your property.',
      );
    }

    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        propertyId,
        ownerId: property.ownerId,
        tenantId,
      },
      include: {
        property: { select: { id: true, title: true, city: true, locality: true } },
        owner: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true } },
      },
    });

    if (existingConversation) return existingConversation;

    return this.prisma.conversation.create({
      data: { propertyId, ownerId: property.ownerId, tenantId },
      include: {
        property: { select: { id: true, title: true, city: true, locality: true } },
        owner: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true } },
      },
    });
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ ownerId: userId }, { tenantId: userId }] },
      include: {
        property: { select: { id: true, title: true, city: true, locality: true } },
        owner: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true } },
        messages: {
          where: { deletedAt: null },
          include: { sender: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conversation) => {
      const otherUser = conversation.ownerId === userId ? conversation.tenant : conversation.owner;
      return {
        conversationId: conversation.id,
        property: conversation.property,
        otherUser,
        lastMessage: conversation.messages.length ? conversation.messages[0] : null,
        updatedAt: conversation.updatedAt,
      };
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    messageType: MessageType = MessageType.TEXT,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        owner: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true } },
        property: { select: { id: true, title: true } },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found.');
    if (conversation.ownerId === conversation.tenantId) throw new ForbiddenException('Invalid conversation participants.');

    if (senderId !== conversation.ownerId && senderId !== conversation.tenantId) {
      throw new ForbiddenException('You are not part of this conversation.');
    }

    const normalizedText = text.trim();
    if (!normalizedText || normalizedText.length > 2000) throw new BadRequestException('Message must be between 1 and 2000 characters.');
    if (messageType !== MessageType.TEXT) throw new BadRequestException('Use the attachment endpoint for non-text messages.');

    const recentCount = await this.prisma.message.count({ where: { conversationId, senderId, createdAt: { gte: new Date(Date.now() - 60_000) } } });
    if (recentCount >= 20) throw new BadRequestException('Message rate limit exceeded. Please try again later.');

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, text: normalizedText, messageType },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const receiverId =
      senderId === conversation.ownerId ? conversation.tenantId : conversation.ownerId;
    const senderName =
      senderId === conversation.ownerId ? conversation.owner.fullName : conversation.tenant.fullName;

    try {
      await this.notificationsService.createNotification(
        receiverId,
        'New Message',
        `${senderName} sent you a message about "${conversation.property.title}".`,
        NotificationType.CHAT_MESSAGE,
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    try {
      await this.pushNotificationsService.sendToUser(
        receiverId,
        'New Message',
        `${senderName} sent you a message about "${conversation.property.title}".`,
        { type: 'CHAT_MESSAGE', conversationId },
      );
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
    }

    return message;
  }

  async uploadAttachment(
    conversationId: string,
    senderId: string,
    file: Express.Multer.File,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found.');

    if (senderId !== conversation.ownerId && senderId !== conversation.tenantId) {
      throw new ForbiddenException('You are not part of this conversation.');
    }

    await validateChatFileUpload(file);
    await this.fileScanService.scan(file);

    const uploaded = await this.storageService.uploadPrivateFile(file, 'chat-attachments');

    try {
      return await this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          text: file.originalname,
          messageType: MessageType.DOCUMENT,
          attachmentPublicId: uploaded.publicId,
          attachmentUrl: null,
          attachmentMime: file.mimetype,
        },
      });
    } catch (error) {
      await this.storageService.deleteImage(uploaded.publicId).catch(() => undefined);
      throw error;
    }
  }

  async getAttachmentUrl(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) throw new NotFoundException('Message not found.');

    if (userId !== message.conversation.ownerId && userId !== message.conversation.tenantId) {
      throw new ForbiddenException('You are not allowed to access this attachment.');
    }

    if (!message.attachmentPublicId) {
      throw new NotFoundException('Attachment not found.');
    }

    return {
      url: await this.storageService.getPrivateUrl(message.attachmentPublicId, 900),
      expiresInSeconds: 900,
    };
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });

    if (!conversation) throw new NotFoundException('Conversation not found.');

    if (conversation.ownerId !== userId && conversation.tenantId !== userId) {
      throw new ForbiddenException('You are not allowed to view these messages.');
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 50;
    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: { sender: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });

    if (!conversation) throw new NotFoundException('Conversation not found.');

    if (conversation.ownerId !== userId && conversation.tenantId !== userId) {
      throw new ForbiddenException('You are not part of this conversation.');
    }

    return this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null, deletedAt: null },
      data: { readAt: new Date() },
    });
  }

  async editMessage(messageId: string, userId: string, newText: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });

    if (!message) throw new NotFoundException('Message not found.');
    if (message.senderId !== userId) throw new ForbiddenException('You can only edit your own messages.');
    if (message.deletedAt) throw new BadRequestException('Deleted messages cannot be edited.');
    const normalizedText = newText.trim();
    if (!normalizedText || normalizedText.length > 2000) throw new BadRequestException('Message must be between 1 and 2000 characters.');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { text: normalizedText, editedAt: new Date() },
      include: { sender: { select: { id: true, fullName: true } } },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });

    if (!message) throw new NotFoundException('Message not found.');
    if (message.senderId !== userId) throw new ForbiddenException('You can only delete your own messages.');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), text: 'This message was deleted' },
    });
  }
}
