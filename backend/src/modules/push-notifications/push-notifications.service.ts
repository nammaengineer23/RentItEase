import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class PushNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    return this.prisma.userDevice.upsert({
      where: { token: dto.token },
      update: { platform: dto.platform, userId },
      create: { token: dto.token, platform: dto.platform, userId },
    });
  }

  // Keep the existing API contract, but enqueue rather than sending inline.
  // Pair with a recently-created in-app notification when possible to avoid
  // generating a second push event for the same business event.
  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    const recent = await this.prisma.notification.findFirst({
      where: { userId, title, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (recent) {
      const existing = await this.prisma.notificationOutbox.findUnique({
        where: { notificationId: recent.id },
        select: { id: true, status: true },
      });
      if (existing) {
        if (existing.status === 'PENDING') {
          await this.prisma.notificationOutbox.update({
            where: { id: existing.id },
            data: { title, body, ...(data ? { data: data as Prisma.InputJsonValue } : {}) },
          });
        }
        return { queued: true, deduplicated: true };
      }
    }
    await this.prisma.notificationOutbox.create({
      data: {
        userId,
        idempotencyKey: `push:${randomUUID()}`,
        title,
        body,
        data: data as Prisma.InputJsonValue | undefined,
      },
    });
    return { queued: true, deduplicated: false };
  }

  // Notify every active admin and persist both the in-app item and FCM outbox event.
  // eventKey is stable for the business action so retries cannot create duplicate alerts.
  async sendToAdmins(
    eventKey: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ) {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true, deletedAt: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.prisma.$transaction(async (tx) => {
        const notification = await tx.notification.create({
          data: {
            userId: admin.id,
            title,
            message: body,
            type: NotificationType.GENERAL,
            relatedId: data.relatedId,
          },
        });
        await tx.notificationOutbox.create({
          data: {
            userId: admin.id,
            notificationId: notification.id,
            idempotencyKey: `admin-approval:${eventKey}:${admin.id}`,
            title,
            body,
            availableAt: new Date(Date.now() + 5000),
            data: {
              ...data,
              notificationId: notification.id,
            } as Prisma.InputJsonValue,
          },
        });
      });
    }
    return { queuedForAdmins: admins.length };
  }

  async unregisterDevice(userId: string, token: string) {
    await this.prisma.userDevice.deleteMany({ where: { userId, token } });
    return { message: 'Device removed successfully' };
  }
}
