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


@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

    // ==========================================
  // Create / Open Conversation
  // ==========================================

  async createConversation(
    propertyId: string,
    tenantId: string,
  ) {
    const property =
      await this.prisma.property.findUnique({
        where: {
          id: propertyId,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    if (property.ownerId === tenantId) {
      throw new BadRequestException(
        'Open Chat to reply to tenant conversations for your property.',
      );
    }

    const existingConversation =
      await this.prisma.conversation.findFirst({
        where: {
          propertyId,
          ownerId: property.ownerId,
          tenantId,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              locality: true,
            },
          },
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

    if (existingConversation) {
      return existingConversation;
    }

    return this.prisma.conversation.create({
      data: {
        propertyId,
        ownerId: property.ownerId,
        tenantId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            locality: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
          },
        },
        tenant: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

    // ==========================================
  // List My Conversations
  // ==========================================

  async listConversations(userId: string) {
    const conversations =
      await this.prisma.conversation.findMany({
        where: {
          OR: [
            {
              ownerId: userId,
            },
            {
              tenantId: userId,
            },
          ],
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              locality: true,
            },
          },
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
          messages: {
            where: {
              deletedAt: null,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

    return conversations.map(
      (conversation) => {
        const otherUser =
          conversation.ownerId === userId
            ? conversation.tenant
            : conversation.owner;

        return {
          conversationId:
            conversation.id,

          property:
            conversation.property,

          otherUser,

          lastMessage:
            conversation.messages.length
              ? conversation.messages[0]
              : null,

          updatedAt:
            conversation.updatedAt,
        };
      },
    );
  }
    // ==========================================
  // Send Message
  // ==========================================

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    messageType: MessageType = MessageType.TEXT,
  ) {
    const conversation =
      await this.prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found.',
      );
    }

    const isParticipant =
      senderId === conversation.ownerId ||
      senderId === conversation.tenantId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not part of this conversation.',
      );
    }

    const message =
      await this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          text,
          messageType,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

    await this.prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    const receiverId =
      senderId === conversation.ownerId
        ? conversation.tenantId
        : conversation.ownerId;

    const senderName =
      senderId === conversation.ownerId
        ? conversation.owner.fullName
        : conversation.tenant.fullName;

    try {
  await this.notificationsService.createNotification(
    receiverId,
    'New Message',
    `${senderName} sent you a message about "${conversation.property.title}".`,
    NotificationType.CHAT_MESSAGE,
  );
} catch (error) {
  console.error(
    'Failed to create notification:',
    error,
  );
}
    try {
  await this.pushNotificationsService.sendToUser(
    receiverId,
    'New Message',
    `${senderName} sent you a message about "${conversation.property.title}".`,
    {
      type: 'CHAT_MESSAGE',
      conversationId,
    },
  );
} catch (error) {
  console.error(
    'Failed to send FCM notification:',
    error,
  );
}

    return message;
  }

  // ==========================================
  // Get Messages
  // ==========================================

  async getMessages(
    conversationId: string,
    userId: string,
  ) {
    const conversation =
      await this.prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
      });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found.',
      );
    }

    const isParticipant =
      conversation.ownerId === userId ||
      conversation.tenantId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not allowed to view these messages.',
      );
    }

    return this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
    // ==========================================
  // Mark Messages As Read
  // ==========================================

  async markAsRead(
    conversationId: string,
    userId: string,
  ) {
    const conversation =
      await this.prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
      });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found.',
      );
    }

    const isParticipant =
      conversation.ownerId === userId ||
      conversation.tenantId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not part of this conversation.',
      );
    }

    return this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        readAt: null,
        deletedAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }


  // ==========================================
  // Edit Message
  // ==========================================

  async editMessage(
    messageId: string,
    userId: string,
    newText: string,
  ) {
    const message =
      await this.prisma.message.findUnique({
        where: {
          id: messageId,
        },
      });

    if (!message) {
      throw new NotFoundException(
        'Message not found.',
      );
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException(
        'You can only edit your own messages.',
      );
    }

    if (message.deletedAt) {
      throw new BadRequestException(
        'Deleted messages cannot be edited.',
      );
    }

    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        text: newText,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }


  // ==========================================
  // Delete Message (Soft Delete)
  // ==========================================

  async deleteMessage(
    messageId: string,
    userId: string,
  ) {
    const message =
      await this.prisma.message.findUnique({
        where: {
          id: messageId,
        },
      });

    if (!message) {
      throw new NotFoundException(
        'Message not found.',
      );
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own messages.',
      );
    }

    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        deletedAt: new Date(),
        text: 'This message was deleted',
      },
    });
  }
}
