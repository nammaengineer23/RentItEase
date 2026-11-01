import { PushNotificationsService } from './push-notifications.service';

describe('PushNotificationsService outbox enqueueing', () => {
  it('enqueues a push event when no in-app notification exists', async () => {
    const prisma = {
      notification: { findFirst: jest.fn().mockResolvedValue(null) },
      notificationOutbox: { create: jest.fn().mockResolvedValue({ id: 'outbox-1' }) },
    };
    const service = new PushNotificationsService(prisma as any);
    const result = await service.sendToUser('user-1', 'RentItEase', 'Test push', { screen: 'home' });
    expect(result).toEqual({ queued: true, deduplicated: false });
    expect(prisma.notificationOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', title: 'RentItEase', body: 'Test push', data: { screen: 'home' } }),
    });
  });

  it('enriches the matching in-app event instead of creating a duplicate', async () => {
    const prisma = {
      notification: { findFirst: jest.fn().mockResolvedValue({ id: 'notification-1' }) },
      notificationOutbox: {
        findUnique: jest.fn().mockResolvedValue({ id: 'outbox-1', status: 'PENDING' }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      },
    };
    const service = new PushNotificationsService(prisma as any);
    const result = await service.sendToUser('user-1', 'Booking Approved', 'Push body', { type: 'BOOKING_APPROVED' });
    expect(result).toEqual({ queued: true, deduplicated: true });
    expect(prisma.notificationOutbox.update).toHaveBeenCalledWith({
      where: { id: 'outbox-1' },
      data: { title: 'Booking Approved', body: 'Push body', data: { type: 'BOOKING_APPROVED' } },
    });
    expect(prisma.notificationOutbox.create).not.toHaveBeenCalled();
  });

  it('does not enqueue a duplicate when the paired event is already complete', async () => {
    const prisma = {
      notification: { findFirst: jest.fn().mockResolvedValue({ id: 'notification-1' }) },
      notificationOutbox: {
        findUnique: jest.fn().mockResolvedValue({ id: 'outbox-1', status: 'COMPLETED' }),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    const service = new PushNotificationsService(prisma as any);
    await service.sendToUser('user-1', 'Booking Approved', 'Push body');
    expect(prisma.notificationOutbox.create).not.toHaveBeenCalled();
    expect(prisma.notificationOutbox.update).not.toHaveBeenCalled();
  });
});
