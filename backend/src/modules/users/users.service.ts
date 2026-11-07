import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OwnerRequestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditContext, AdminAuditService } from '../admin/admin-audit.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly pushNotifications: PushNotificationsService,
  ) {}

  async requestOwnerRole(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role !== UserRole.USER) {
      throw new BadRequestException('Only tenant accounts can request owner access.');
    }
    if (user.ownerRequestStatus === OwnerRequestStatus.PENDING) {
      throw new BadRequestException('Owner request is already pending.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ownerRequestStatus: OwnerRequestStatus.PENDING,
        ownerRequestedAt: new Date(),
        ownerReviewedAt: null,
      },
      select: { id: true, fullName: true, email: true, role: true, ownerRequestStatus: true, ownerRequestedAt: true },
    });

    try {
      await this.pushNotifications.sendToAdmins(
        `owner-request:${updated.id}:${updated.ownerRequestedAt?.toISOString() ?? 'pending'}`,
        'Owner access approval required',
        `${updated.fullName} (${updated.email}) requested Owner access.`,
        { screen: 'admin_users', userId: updated.id, event: 'OWNER_REQUEST' },
      );
    } catch (error) {
      // The owner request is already saved; a push outage must not make the request appear to fail.
      console.error('Unable to queue admin owner-request notification:', error);
    }
    return updated;
  }

  getOwnerRequests() {
    return this.prisma.user.findMany({
      where: { ownerRequestStatus: OwnerRequestStatus.PENDING },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        ownerRequestStatus: true,
        ownerRequestedAt: true,
      },
      orderBy: { ownerRequestedAt: 'asc' },
    });
  }

  async reviewOwnerRequest(
    userId: string,
    approve: boolean,
    context: AdminAuditContext,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.ownerRequestStatus !== OwnerRequestStatus.PENDING) {
      throw new BadRequestException('No pending owner request found.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: approve ? UserRole.OWNER : user.role,
        ownerRequestStatus: approve
          ? OwnerRequestStatus.APPROVED
          : OwnerRequestStatus.REJECTED,
        ownerReviewedAt: new Date(),
      },
      select: { id: true, role: true, ownerRequestStatus: true, ownerReviewedAt: true },
    });

    await this.audit.record(
      context,
      approve ? 'OWNER_REQUEST_APPROVE' : 'OWNER_REQUEST_REJECT',
      'USER',
      userId,
      user,
      updated,
    );
    return updated;
  }
}
