import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // The in-app record and push event are committed atomically.
  async createNotification(userId: string, title: string, message: string, type: NotificationType, relatedId?: string) {
    const notification = await this.prisma.$transaction(async (tx) => {
      const created = await tx.notification.create({
        data: { userId, title, message, type, relatedId },
      });
      await tx.notificationOutbox.create({
        data: {
          userId,
          notificationId: created.id,
          idempotencyKey: `notification:${created.id}`,
          title,
          body: message,
          data: {
            type,
            notificationId: created.id,
            ...(relatedId ? { relatedId } : {}),
          } as Prisma.InputJsonValue,
        },
      });
      return created;
    });
    return serializePrisma(notification);
  }

  async getMyNotifications(user: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.notification.count({ where: { userId: user.id } }),
      this.prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);
    return serializePrisma({ total, unread, notifications, pagination: { page, limit, totalPages: Math.ceil(total / limit) } });
  }

  async getUnreadCount(user: any) {
    const count = await this.prisma.notification.count({ where: { userId: user.id, isRead: false } });
    return { unread: count };
  }

  async markAsRead(id: string, user: any) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!notification) throw new NotFoundException('Notification not found.');
    const updated = await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    return { message: 'Notification marked as read.', notification: serializePrisma(updated) };
  }

  async markAllAsRead(user: any) {
    await this.prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    return { message: 'All notifications marked as read.' };
  }

  async remove(id: string, user: any) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!notification) throw new NotFoundException('Notification not found.');
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully.' };
  }
}
