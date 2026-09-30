import { ForbiddenException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      notification: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      userDevice: {
        findMany: jest.fn(),
      },
      notificationDelivery: {
        createMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      propertyVisit: {
        findFirst: jest.fn(),
      },
      conversation: {
        findFirst: jest.fn(),
      },
      property: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
    };

    service = new NotificationsService(prisma);
  });

  it('paginates notifications and returns unread count', async () => {
    prisma.notification.findMany.mockResolvedValue([
      { id: 'n1', isRead: false, createdAt: new Date() },
    ]);
    prisma.notification.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);

    const result = await service.getMyNotifications(
      { id: 'user-1' },
      2,
      2,
    );

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 2,
        take: 2,
      }),
    );
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.unread).toBe(2);
  });

  it('prevents duplicate notifications with the same dedupe key', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'existing',
      dedupeKey: 'same',
    });

    const result = await service.createNotification(
      'user-1',
      'Title',
      'Message',
      NotificationType.GENERAL,
      undefined,
      'same',
    );

    expect(result.id).toBe('existing');
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('creates durable push deliveries for every registered device', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);
    prisma.notification.create.mockResolvedValue({
      id: 'n1',
      userId: 'user-1',
      title: 'Title',
      message: 'Message',
      type: NotificationType.GENERAL,
      relatedId: null,
      dedupeKey: 'dedupe',
    });
    prisma.userDevice.findMany.mockResolvedValue([
      { id: 'd1' },
      { id: 'd2' },
    ]);

    await service.createNotification(
      'user-1',
      'Title',
      'Message',
      NotificationType.GENERAL,
      undefined,
      'dedupe',
    );

    expect(prisma.notificationDelivery.createMany).toHaveBeenCalledWith({
      data: [
        { notificationId: 'n1', deviceId: 'd1' },
        { notificationId: 'n1', deviceId: 'd2' },
      ],
      skipDuplicates: true,
    });
  });

  it('rejects related resources that the recipient cannot access', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
    });
    prisma.conversation.findFirst.mockResolvedValue(null);

    await expect(
      service.createNotification(
        'user-1',
        'Chat',
        'Message',
        NotificationType.CHAT_MESSAGE,
        'conversation-other-user',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks only the authenticated user notification as read', async () => {
    prisma.notification.findFirst.mockResolvedValue({
      id: 'n1',
      userId: 'user-1',
    });
    prisma.notification.update.mockResolvedValue({
      id: 'n1',
      userId: 'user-1',
      isRead: true,
    });

    await service.markAsRead('n1', { id: 'user-1' });

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'n1', userId: 'user-1' },
    });
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { isRead: true },
    });
  });
});
