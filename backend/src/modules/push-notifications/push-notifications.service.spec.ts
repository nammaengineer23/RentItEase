import { PushNotificationsService } from './push-notifications.service';

describe('PushNotificationsService outbox enqueueing', () => {
  it('creates in-app and outbox notifications for every active admin', async () => {
    const tx = {
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]) },
      notification: { create: jest.fn().mockImplementation(async ({ data }) => ({ id: `notification-${data.userId}` })) },
      notificationOutbox: { create: jest.fn().mockResolvedValue({ id: 'outbox-1' }) },
    };
    const service = new PushNotificationsService({} as any);
    await expect(service.sendToAdmins('event-1', 'Approval required', 'New property', { event: 'PROPERTY_SUBMITTED' }, tx as any)).resolves.toEqual({ queuedForAdmins: 2 });
    expect(tx.notification.create).toHaveBeenCalledTimes(2);
    expect(tx.notificationOutbox.create).toHaveBeenCalledTimes(2);
    expect(tx.notificationOutbox.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ idempotencyKey: 'admin-approval:event-1:admin-1' }) }));
  });
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
