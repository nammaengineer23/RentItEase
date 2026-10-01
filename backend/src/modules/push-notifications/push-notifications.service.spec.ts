jest.mock('../../firebase/firebase.service', () => ({
  FirebaseService: jest.fn(),
}));

import { PushNotificationsService } from './push-notifications.service';

describe('PushNotificationsService', () => {
  let service: PushNotificationsService;
  let prisma: any;
  let firebase: any;

  beforeEach(() => {
    jest.useFakeTimers();
    prisma = {
      userDevice: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      notification: {
        findMany: jest.fn(),
      },
      notificationDelivery: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      userSettings: {
        findUnique: jest.fn(),
      },
    };
    firebase = {
      sendToDevice: jest.fn(),
    };
    service = new PushNotificationsService(prisma, firebase);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('registers a device and backfills recent notifications', async () => {
    prisma.userDevice.upsert.mockResolvedValue({
      id: 'device-1',
      token: 'token-1',
      userId: 'user-1',
    });
    prisma.notification.findMany.mockResolvedValue([
      { id: 'notification-1' },
    ]);

    await service.registerDevice('user-1', {
      token: 'token-1',
      platform: 'android',
    });

    expect(prisma.notificationDelivery.createMany).toHaveBeenCalledWith({
      data: [{ notificationId: 'notification-1', deviceId: 'device-1' }],
      skipDuplicates: true,
    });
  });

  it('removes invalid FCM tokens after a push failure', async () => {
    firebase.sendToDevice.mockRejectedValue({
      code: 'messaging/registration-token-not-registered',
    });
    prisma.userDevice.findMany.mockResolvedValue([
      { id: 'd1', token: 'bad-token' },
    ]);
    prisma.userSettings.findUnique.mockResolvedValue({
      pushNotifications: true,
    });

    await service.sendToUser('user-1', 'Title', 'Body');

    expect(prisma.userDevice.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ['bad-token'] } },
    });
  });

  it('retries transient delivery failures with exponential backoff', async () => {
    prisma.userSettings.findUnique.mockResolvedValue({
      pushNotifications: true,
    });
    firebase.sendToDevice.mockRejectedValue(new Error('temporary outage'));
    prisma.notificationDelivery.update.mockResolvedValue({});

    await (service as any).deliverOne({
      id: 'delivery-1',
      attemptCount: 0,
      deviceId: 'device-1',
      notification: {
        userId: 'user-1',
        title: 'Title',
        message: 'Body',
        type: 'GENERAL',
        relatedId: null,
      },
      device: { token: 'token-1' },
    });

    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({
          status: 'PENDING',
          attemptCount: 1,
          lastError: 'temporary outage',
        }),
      }),
    );
  });
});
