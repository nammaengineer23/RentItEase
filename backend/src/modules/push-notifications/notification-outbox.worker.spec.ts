import { NotificationOutbox } from '@prisma/client';
import { NotificationOutboxWorker } from './notification-outbox.worker';

describe('NotificationOutboxWorker', () => {
  const event = {
    id: 'outbox-1', userId: 'user-1', lockToken: 'lock-1',
    title: 'Booking Approved', body: 'Your booking was approved.',
    data: { type: 'BOOKING_APPROVED' }, maxAttempts: 8,
  } as NotificationOutbox;

  it('marks events skipped when no devices are registered', async () => {
    const prisma = {
      userSettings: { findUnique: jest.fn().mockResolvedValue(null) },
      userDevice: { findMany: jest.fn().mockResolvedValue([]) },
      notificationOutbox: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const worker = new NotificationOutboxWorker(prisma as any, {} as any, {} as any);
    await (worker as any).processEvent(event);
    expect(prisma.notificationOutbox.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: event.id, lockToken: event.lockToken },
      data: expect.objectContaining({ status: 'SKIPPED' }),
    }));
  });

  it('sends per device and records successful delivery', async () => {
    const delivery = { id: 'delivery-1', attemptCount: 0, nextAttemptAt: new Date(), device: { id: 'device-1', token: 'fcm-token' } };
    const prisma = {
      userSettings: { findUnique: jest.fn().mockResolvedValue({ pushNotifications: true }) },
      userDevice: { findMany: jest.fn().mockResolvedValue([{ id: 'device-1', token: 'fcm-token' }]) },
      notificationOutboxDelivery: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValueOnce([delivery]).mockResolvedValueOnce([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
      },
      notificationOutbox: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const firebase = { sendToDevice: jest.fn().mockResolvedValue('fcm-message-id') };
    const worker = new NotificationOutboxWorker(prisma as any, firebase as any, {} as any);
    await (worker as any).processEvent(event);
    expect(firebase.sendToDevice).toHaveBeenCalledWith('fcm-token', event.title, event.body, { type: 'BOOKING_APPROVED' });
    expect(prisma.notificationOutboxDelivery.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'delivery-1' }, data: expect.objectContaining({ status: 'SENT' }),
    }));
    expect(prisma.notificationOutbox.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED' }),
    }));
  });

  it('retries transient FCM failures with a scheduled delay', async () => {
    const delivery = { id: 'delivery-1', attemptCount: 0, nextAttemptAt: new Date(), device: { id: 'device-1', token: 'fcm-token' } };
    const prisma = {
      userSettings: { findUnique: jest.fn().mockResolvedValue({ pushNotifications: true }) },
      userDevice: { findMany: jest.fn().mockResolvedValue([{ id: 'device-1', token: 'fcm-token' }]) },
      notificationOutboxDelivery: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValueOnce([delivery]).mockResolvedValueOnce([{ nextAttemptAt: new Date(Date.now() + 1000) }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn(),
      },
      notificationOutbox: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const firebase = { sendToDevice: jest.fn().mockRejectedValue(new Error('FCM unavailable')) };
    const worker = new NotificationOutboxWorker(prisma as any, firebase as any, {} as any);
    await (worker as any).processEvent(event);
    expect(prisma.notificationOutboxDelivery.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'RETRY', lastError: 'FCM unavailable' }),
    }));
    expect(prisma.notificationOutbox.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING' }),
    }));
  });

  it('does not send an event to a device reassigned to another account', async () => {
    const delivery = {
      id: 'delivery-1',
      attemptCount: 0,
      nextAttemptAt: new Date(),
      device: { id: 'device-1', token: 'fcm-token', userId: 'different-user' },
    };
    const prisma = {
      userSettings: { findUnique: jest.fn().mockResolvedValue({ pushNotifications: true }) },
      userDevice: { findMany: jest.fn().mockResolvedValue([{ id: 'device-1', token: 'fcm-token' }]) },
      notificationOutboxDelivery: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValueOnce([delivery]).mockResolvedValueOnce([]),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      notificationOutbox: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const firebase = { sendToDevice: jest.fn() };
    const worker = new NotificationOutboxWorker(prisma as any, firebase as any, {} as any);

    await (worker as any).processEvent(event);

    expect(firebase.sendToDevice).not.toHaveBeenCalled();
    expect(prisma.notificationOutboxDelivery.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'SKIPPED' }),
    }));
  });

});
