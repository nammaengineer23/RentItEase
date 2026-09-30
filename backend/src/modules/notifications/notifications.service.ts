import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { NotificationType } from '@prisma/client';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    relatedId?: string,
    dedupeKey?: string,
  ) {
    await this.assertRelatedResourceAccess(userId, type, relatedId);

    const stableKey =
      dedupeKey ??
      createHash('sha256')
        .update(JSON.stringify({ userId, title, message, type, relatedId: relatedId ?? null }))
        .digest('hex');

    const existing = await this.prisma.notification.findUnique({
      where: { dedupeKey: stableKey },
    });
    if (existing) {
      return serializePrisma(existing);
    }

    const notification = await this.prisma.$transaction(async (tx) => {
      const created = await tx.notification.create({
        data: {
          userId,
          title: title.trim().slice(0, 200),
          message: message.trim().slice(0, 2000),
          type,
          relatedId,
          dedupeKey: stableKey,
        },
      });

      const devices = await tx.userDevice.findMany({
        where: { userId },
        select: { id: true },
      });

      if (devices.length) {
        await tx.notificationDelivery.createMany({
          data: devices.map((device) => ({
            notificationId: created.id,
            deviceId: device.id,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return serializePrisma(notification);
  }

  async getMyNotifications(
    user: any,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  ) {
    const safePage = Math.max(Number(page) || DEFAULT_PAGE, 1);
    const safeLimit = Math.min(
      Math.max(Number(limit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const where = { userId: user.id };
    const [notifications, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return serializePrisma({
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      unread,
      notifications,
    });
  }

  async getUnreadCount(user: any) {
    const count = await this.prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });
    return { unread: count };
  }

  async markAsRead(id: string, user: any) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return {
      message: 'Notification marked as read.',
      notification: serializePrisma(updated),
    };
  }

  async markAllAsRead(user: any) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read.' };
  }

  async remove(id: string, user: any) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully.' };
  }

  private async assertRelatedResourceAccess(
    userId: string,
    type: NotificationType,
    relatedId?: string,
  ) {
    if (!relatedId) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role === 'ADMIN') return;

    const visitTypes: NotificationType[] = [
      NotificationType.VISIT_REQUEST,
      NotificationType.VISIT_APPROVED,
      NotificationType.VISIT_REJECTED,
      NotificationType.VISIT_COMPLETED,
      NotificationType.VISIT_CANCELLED,
    ];
    if (visitTypes.includes(type)) {
      const visit = await this.prisma.propertyVisit.findFirst({
        where: {
          id: relatedId,
          OR: [
            { tenantId: userId },
            { property: { ownerId: userId } },
          ],
        },
        select: { id: true },
      });
      if (!visit) throw new ForbiddenException('Notification resource is not authorized.');
      return;
    }

    if (type === NotificationType.CHAT_MESSAGE) {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: relatedId,
          OR: [{ ownerId: userId }, { tenantId: userId }],
        },
        select: { id: true },
      });
      if (!conversation) throw new ForbiddenException('Notification resource is not authorized.');
      return;
    }

    const propertyTypes: NotificationType[] = [
      NotificationType.REVIEW_ADDED,
      NotificationType.FAVORITE_ADDED,
      NotificationType.PROPERTY_APPROVED,
      NotificationType.PROPERTY_REJECTED,
    ];
    if (propertyTypes.includes(type)) {
      const property = await this.prisma.property.findFirst({
        where: { id: relatedId, ownerId: userId },
        select: { id: true },
      });
      if (!property) throw new ForbiddenException('Notification resource is not authorized.');
    }
  }
}
