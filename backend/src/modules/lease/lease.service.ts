import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BookingStatus,
  LeaseStatus,
  NotificationType,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';

@Injectable()
export class LeaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  async create(dto: CreateLeaseDto, user: any) {
    await this.expireOverdueLeases();

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        payment: true,
        lease: true,
        property: {
          include: {
            owner: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
        tenant: { select: { id: true, fullName: true, email: true, phone: true } },
        visit: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found.');

    if (user.role !== UserRole.ADMIN && booking.tenantId !== user.id) {
      throw new ForbiddenException('Only the booking tenant can create this lease.');
    }

    if (booking.property.ownerId === booking.tenantId) {
      throw new BadRequestException('A tenant cannot lease their own property.');
    }

    if (booking.status !== BookingStatus.PAID) {
      throw new BadRequestException('Lease can only be created from a paid booking.');
    }

    if (!booking.payment || booking.payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('A successful payment is required before lease creation.');
    }

    if (booking.lease) {
      throw new ConflictException('A lease already exists for this booking.');
    }

    if (booking.monthlyRent.toString() !== booking.property.price.toString()) {
      throw new BadRequestException('Booking rent does not match the property rent.');
    }

    if (booking.securityDeposit.toString() !== booking.property.securityDeposit.toString()) {
      throw new BadRequestException('Booking security deposit does not match the property deposit.');
    }

    const startDate = new Date(dto.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid lease start date.');
    }

    if (startDate < booking.bookingDate) {
      throw new BadRequestException('Lease start date cannot be before the booking date.');
    }

    let endDate: Date | undefined;
    if (dto.endDate) {
      endDate = new Date(dto.endDate);
      if (Number.isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid lease end date.');
      }
      if (endDate <= startDate) {
        throw new BadRequestException('Lease end date must be after the start date.');
      }
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { paymentId: booking.payment.id },
      select: { id: true, userId: true, totalAmount: true, status: true },
    });

    if (!invoice || invoice.userId !== booking.tenantId || invoice.status !== 'PAID') {
      throw new BadRequestException(
        'A paid invoice linked to the successful booking payment is required.',
      );
    }

    try {
      const lease = await this.prisma.$transaction(async (tx) => {
        const active = await tx.lease.findFirst({
          where: {
            propertyId: booking.propertyId,
            status: LeaseStatus.ACTIVE,
          },
          select: { id: true },
        });

        if (active) {
          throw new ConflictException('This property already has an active lease.');
        }

        const created = await tx.lease.create({
          data: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            tenantId: booking.tenantId,
            paymentId: booking.payment.id,
            invoiceId: invoice.id,
            status: LeaseStatus.ACTIVE,
            monthlyRent: booking.monthlyRent,
            securityDeposit: booking.securityDeposit,
            startDate,
            endDate,
            signedAt: new Date(),
            notes: dto.notes,
          },
          include: {
            booking: true,
            payment: true,
            invoice: true,
            property: {
              include: {
                owner: { select: { id: true, fullName: true, email: true, phone: true } },
                images: {
                  where: { isPrimary: true },
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
            tenant: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        });

        await tx.property.update({
          where: { id: booking.propertyId },
          data: { isAvailable: false },
        });

        return created;
      });

      await this.notifyLease(
        lease.id,
        booking.tenantId,
        booking.property.ownerId,
        'Lease Created',
        `The lease for "${booking.property.title}" has been created successfully.`,
        'LEASE_CREATED',
      );

      return {
        success: true,
        message: 'Lease created successfully.',
        data: serializePrisma(lease),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A conflicting lease or financial relationship already exists.');
      }
      throw error;
    }
  }

  async getTenantLeases(user: any) {
    await this.expireOverdueLeases();
    const leases = await this.prisma.lease.findMany({
      where: { tenantId: user.id },
      include: this.leaseInclude(),
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, total: leases.length, leases: serializePrisma(leases) };
  }

  async getOwnerLeases(user: any) {
    await this.expireOverdueLeases();
    const leases = await this.prisma.lease.findMany({
      where: { property: { ownerId: user.id } },
      include: this.leaseInclude(),
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, total: leases.length, leases: serializePrisma(leases) };
  }

  async findOne(id: string, user?: any) {
    await this.expireOverdueLeases();

    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: this.leaseInclude(),
    });

    if (!lease) throw new NotFoundException('Lease not found.');

    if (
      user &&
      user.role !== UserRole.ADMIN &&
      lease.tenantId !== user.id &&
      lease.property.ownerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this lease.');
    }

    return { success: true, data: serializePrisma(lease) };
  }

  async renew(id: string, dto: RenewLeaseDto, user: any) {
    await this.expireOverdueLeases();
    const lease = await this.getLeaseForUpdate(id);

    this.ensureParticipant(lease, user);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException(`Lease cannot be renewed from ${lease.status} status.`);
    }

    if (!lease.endDate) {
      throw new BadRequestException('A lease without an end date cannot be renewed.');
    }

    const newEndDate = new Date(dto.endDate);
    if (Number.isNaN(newEndDate.getTime()) || newEndDate <= lease.endDate) {
      throw new BadRequestException('Renewal end date must be after the current lease end date.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.lease.updateMany({
        where: { id, status: LeaseStatus.ACTIVE },
        data: {
          endDate: newEndDate,
          renewedAt: new Date(),
          renewalCount: { increment: 1 },
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Lease changed before renewal could be completed.');
      }

      return tx.lease.findUniqueOrThrow({
        where: { id },
        include: this.leaseInclude(),
      });
    });

    await this.notifyLease(
      result.id,
      result.tenantId,
      result.property.ownerId,
      'Lease Renewed',
      `The lease for "${result.property.title}" has been renewed.`,
      'LEASE_RENEWED',
    );

    return {
      success: true,
      message: 'Lease renewed successfully.',
      data: serializePrisma(result),
    };
  }

  async complete(id: string, user: any) {
    await this.expireOverdueLeases();
    const lease = await this.getLeaseForUpdate(id);
    this.ensureOwnerOrAdmin(lease, user);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException(`Lease cannot be completed from ${lease.status} status.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lease.updateMany({
        where: { id, status: LeaseStatus.ACTIVE },
        data: { status: LeaseStatus.COMPLETED, completedAt: new Date() },
      });

      if (result.count !== 1) {
        throw new ConflictException('Lease changed before completion could be completed.');
      }

      await tx.property.update({
        where: { id: lease.propertyId },
        data: { isAvailable: true },
      });

      return tx.lease.findUniqueOrThrow({
        where: { id },
        include: this.leaseInclude(),
      });
    });

    await this.notifyLease(
      updated.id,
      updated.tenantId,
      updated.property.ownerId,
      'Lease Completed',
      `Your lease for "${updated.property.title}" has been completed.`,
      'LEASE_COMPLETED',
    );

    return { success: true, message: 'Lease completed successfully.', data: serializePrisma(updated) };
  }

  async terminate(id: string, user: any) {
    await this.expireOverdueLeases();
    const lease = await this.getLeaseForUpdate(id);
    this.ensureParticipant(lease, user);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException(`Lease cannot be terminated from ${lease.status} status.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lease.updateMany({
        where: { id, status: LeaseStatus.ACTIVE },
        data: { status: LeaseStatus.TERMINATED, terminatedAt: new Date() },
      });

      if (result.count !== 1) {
        throw new ConflictException('Lease changed before termination could be completed.');
      }

      await tx.property.update({
        where: { id: lease.propertyId },
        data: { isAvailable: true },
      });

      return tx.lease.findUniqueOrThrow({
        where: { id },
        include: this.leaseInclude(),
      });
    });

    await this.notifyLease(
      updated.id,
      updated.tenantId,
      updated.property.ownerId,
      'Lease Terminated',
      `Your lease for "${updated.property.title}" has been terminated.`,
      'LEASE_TERMINATED',
    );

    return { success: true, message: 'Lease terminated successfully.', data: serializePrisma(updated) };
  }

  async cancel(id: string, user: any) {
    await this.expireOverdueLeases();
    const lease = await this.getLeaseForUpdate(id);
    this.ensureOwnerOrAdmin(lease, user);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException(`Lease cannot be cancelled from ${lease.status} status.`);
    }

    if (new Date() >= lease.startDate) {
      throw new BadRequestException('An active lease cannot be cancelled after its start date; terminate it instead.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lease.updateMany({
        where: { id, status: LeaseStatus.ACTIVE },
        data: { status: LeaseStatus.CANCELLED },
      });

      if (result.count !== 1) {
        throw new ConflictException('Lease changed before cancellation could be completed.');
      }

      await tx.property.update({
        where: { id: lease.propertyId },
        data: { isAvailable: true },
      });

      return tx.lease.findUniqueOrThrow({
        where: { id },
        include: this.leaseInclude(),
      });
    });

    await this.notifyLease(
      updated.id,
      updated.tenantId,
      updated.property.ownerId,
      'Lease Cancelled',
      `The lease for "${updated.property.title}" has been cancelled.`,
      'LEASE_CANCELLED',
    );

    return { success: true, message: 'Lease cancelled successfully.', data: serializePrisma(updated) };
  }

  async expireOverdueLeases() {
    const overdue = await this.prisma.lease.findMany({
      where: {
        status: LeaseStatus.ACTIVE,
        endDate: { lte: new Date() },
      },
      include: {
        property: { select: { id: true, title: true, ownerId: true } },
      },
      take: 100,
    });

    for (const lease of overdue) {
      const result = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.lease.updateMany({
          where: {
            id: lease.id,
            status: LeaseStatus.ACTIVE,
            endDate: { lte: new Date() },
          },
          data: { status: LeaseStatus.EXPIRED, expiredAt: new Date() },
        });

        if (updated.count !== 1) return false;

        await tx.property.update({
          where: { id: lease.propertyId },
          data: { isAvailable: true },
        });

        return true;
      });

      if (result) {
        await this.notifyLease(
          lease.id,
          lease.tenantId,
          lease.property.ownerId,
          'Lease Expired',
          `The lease for "${lease.property.title}" has expired.`,
          'LEASE_EXPIRED',
        );
      }
    }

    return { expired: overdue.length };
  }

  private async getLeaseForUpdate(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        booking: true,
        payment: true,
        invoice: true,
      },
    });

    if (!lease) throw new NotFoundException('Lease not found.');
    return lease;
  }

  private ensureOwnerOrAdmin(lease: any, user: any) {
    if (user.role !== UserRole.ADMIN && lease.property.ownerId !== user.id) {
      throw new ForbiddenException('Only the property owner or admin can perform this action.');
    }
  }

  private ensureParticipant(lease: any, user: any) {
    const allowed =
      user.role === UserRole.ADMIN ||
      lease.tenantId === user.id ||
      lease.property.ownerId === user.id;

    if (!allowed) {
      throw new ForbiddenException('You do not have permission to modify this lease.');
    }
  }

  private leaseInclude() {
    return {
      booking: true,
      payment: true,
      invoice: true,
      property: {
        include: {
          owner: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          images: {
            where: { isPrimary: true },
            orderBy: { displayOrder: 'asc' as const },
          },
        },
      },
      tenant: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
    } as const;
  }

  private async notifyLease(
    leaseId: string,
    tenantId: string,
    ownerId: string,
    title: string,
    message: string,
    eventType: string,
  ) {
    await Promise.all([
      this.notificationsService.createNotification(
        tenantId,
        title,
        message,
        NotificationType.GENERAL,
        leaseId,
      ),
      this.notificationsService.createNotification(
        ownerId,
        title,
        message,
        NotificationType.GENERAL,
        leaseId,
      ),
      this.pushNotificationsService.sendToUser(
        tenantId,
        title,
        message,
        { type: eventType, leaseId },
      ),
      this.pushNotificationsService.sendToUser(
        ownerId,
        title,
        message,
        { type: eventType, leaseId },
      ),
    ]);
  }
}
