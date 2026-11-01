import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';

describe('NotificationsService durable outbox', () => {
  it('persists the in-app notification and outbox event in one transaction', async () => {
    const notification = { id: 'notification-1', userId: 'user-1', title: 'Booking Approved', message: 'Your booking was approved.', type: NotificationType.GENERAL };
    const tx = {
      notification: { create: jest.fn().mockResolvedValue(notification) },
      notificationOutbox: { create: jest.fn().mockResolvedValue({ id: 'outbox-1' }) },
    };
    const prisma = { $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) };
    const service = new NotificationsService(prisma as any);
    await service.createNotification('user-1', 'Booking Approved', 'Your booking was approved.', NotificationType.GENERAL, 'booking-1');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.notificationOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1', notificationId: 'notification-1',
        idempotencyKey: 'notification:notification-1',
        title: 'Booking Approved', body: 'Your booking was approved.',
        data: expect.objectContaining({ type: NotificationType.GENERAL, relatedId: 'booking-1' }),
      }),
    });
  });
});
