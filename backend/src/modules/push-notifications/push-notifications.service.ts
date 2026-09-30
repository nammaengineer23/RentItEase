import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { NotificationDeliveryStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { FirebaseService } from '../../firebase/firebase.service';

const WORKER_INTERVAL_MS = 15_000;
const PROCESSING_LEASE_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class PushNotificationsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PushNotificationsService.name);
  private worker?: NodeJS.Timeout;
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  onModuleInit() {
    this.worker = setInterval(() => {
      void this.processPendingDeliveries();
    }, WORKER_INTERVAL_MS);
    void this.processPendingDeliveries();
  }

  onModuleDestroy() {
    if (this.worker) clearInterval(this.worker);
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const device = await this.prisma.userDevice.upsert({
      where: { token: dto.token },
      update: {
        platform: dto.platform,
        userId,
        updatedAt: new Date(),
      },
      create: {
        token: dto.token,
        platform: dto.platform,
        userId,
      },
    });

    const pendingNotifications = await this.prisma.notification.findMany({
      where: {
        userId,
        deliveries: {
          none: {
            deviceId: device.id,
          },
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true },
      take: 500,
    });

    if (pendingNotifications.length) {
      await this.prisma.notificationDelivery.createMany({
        data: pendingNotifications.map((notification) => ({
          notificationId: notification.id,
          deviceId: device.id,
        })),
        skipDuplicates: true,
      });
    }

    return device;
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { pushNotifications: true },
    });

    if (settings?.pushNotifications === false) {
      return { success: false, message: 'Push notifications disabled by user' };
    }

    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      select: { id: true, token: true },
    });

    if (!devices.length) {
      return { success: false, message: 'No registered devices' };
    }

    const results = await Promise.allSettled(
      devices.map((device) =>
        this.firebaseService.sendToDevice(device.token, title, body, data),
      ),
    );

    const invalidTokens = devices
      .filter((device, index) => {
        const result = results[index];
        if (result.status !== 'rejected') return false;
        return this.isInvalidTokenError(result.reason);
      })
      .map((device) => device.token);

    if (invalidTokens.length) {
      await this.prisma.userDevice.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }

    return {
      success: results.some((result) => result.status === 'fulfilled'),
      results,
    };
  }

  async unregisterDevice(userId: string, token: string) {
    await this.prisma.userDevice.deleteMany({
      where: { userId, token },
    });

    return { message: 'Device removed successfully' };
  }

  private async processPendingDeliveries() {
    if (this.processing) return;
    this.processing = true;

    try {
      await this.prisma.notificationDelivery.updateMany({
        where: {
          status: NotificationDeliveryStatus.PROCESSING,
          processingAt: {
            lt: new Date(Date.now() - PROCESSING_LEASE_MS),
          },
        },
        data: {
          status: NotificationDeliveryStatus.PENDING,
          processingAt: null,
        },
      });

      for (let i = 0; i < 25; i += 1) {
        const delivery = await this.prisma.notificationDelivery.findFirst({
          where: {
            status: NotificationDeliveryStatus.PENDING,
            nextRetryAt: { lte: new Date() },
          },
          include: {
            notification: true,
            device: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        if (!delivery) break;

        const claimed = await this.prisma.notificationDelivery.updateMany({
          where: {
            id: delivery.id,
            status: NotificationDeliveryStatus.PENDING,
          },
          data: {
            status: NotificationDeliveryStatus.PROCESSING,
            processingAt: new Date(),
          },
        });

        if (!claimed.count) continue;

        await this.deliverOne(delivery);
      }
    } catch (error) {
      this.logger.error('Notification delivery worker failed', error);
    } finally {
      this.processing = false;
    }
  }

  private async deliverOne(delivery: any) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId: delivery.notification.userId },
      select: { pushNotifications: true },
    });

    if (settings?.pushNotifications === false) {
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.SENT,
          processingAt: null,
          lastError: 'Suppressed by user notification preference',
        },
      });
      return;
    }

    try {
      await this.firebaseService.sendToDevice(
        delivery.device.token,
        delivery.notification.title,
        delivery.notification.message,
        {
          type: delivery.notification.type,
          ...(delivery.notification.relatedId
            ? { relatedId: delivery.notification.relatedId }
            : {}),
        },
      );

      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
          processingAt: null,
          lastError: null,
          attemptCount: { increment: 1 },
        },
      });
    } catch (error) {
      if (this.isInvalidTokenError(error)) {
        await this.prisma.userDevice.deleteMany({
          where: { id: delivery.deviceId },
        });
        return;
      }

      const attempts = delivery.attemptCount + 1;
      const terminal = attempts >= MAX_ATTEMPTS;
      const delayMs = Math.min(
        60 * 60_000,
        60_000 * 2 ** Math.max(attempts - 1, 0),
      );

      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: terminal
            ? NotificationDeliveryStatus.FAILED
            : NotificationDeliveryStatus.PENDING,
          attemptCount: attempts,
          processingAt: null,
          lastError: this.errorMessage(error),
          nextRetryAt: new Date(Date.now() + delayMs),
        },
      });

      if (terminal) {
        this.logger.warn(
          `Notification delivery ${delivery.id} permanently failed after ${attempts} attempts`,
        );
      }
    }
  }

  private isInvalidTokenError(error: any) {
    return (
      error?.code === 'messaging/registration-token-not-registered' ||
      error?.code === 'messaging/invalid-registration-token'
    );
  }

  private errorMessage(error: any) {
    if (error instanceof Error) return error.message.slice(0, 1000);
    return String(error).slice(0, 1000);
  }
}
