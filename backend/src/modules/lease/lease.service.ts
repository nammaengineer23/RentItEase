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
  PropertyLifecycleStatus,
  NotificationType,
  PaymentStatus,
  Prisma,
  UserRole,
  Prisma,
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
    const startDate = new Date(dto.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid lease start date.');
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

    let lease;
    try {
      lease = await this.prisma.$transaction(
        async (tx) => {
          const booking = await tx.booking.findUnique({
            where: { id: dto.bookingId },
            include: {
              property: {
                include: {
                  owner: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
              tenant: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
              lease: true,
            },
          });

          if (!booking) throw new NotFoundException('Booking not found.');

          if (user.role !== UserRole.ADMIN && booking.tenantId !== user.id) {
            throw new ForbiddenException(
              'Only the booking tenant can create this lease.',
            );
          }

          if (booking.status !== BookingStatus.PAID) {
            throw new BadRequestException(
              'Lease can only be created from a paid booking.',
            );
          }

          if (booking.lease) {
            throw new BadRequestException(
              'A lease already exists for this booking.',
            );
          }

          const existingActiveLease = await tx.lease.findFirst({
            where: {
              propertyId: booking.propertyId,
              status: LeaseStatus.ACTIVE,
            },
            select: { id: true },
          });

          if (existingActiveLease) {
            throw new BadRequestException(
              'This property already has an active lease.',
            );
          }

          const createdLease = await tx.lease.create({
            data: {
              bookingId: booking.id,
              propertyId: booking.propertyId,
              tenantId: booking.tenantId,
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
              property: {
                include: {
                  owner: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phone: true,
                    },
                  },
                  images: {
                    where: { isPrimary: true },
                    orderBy: { displayOrder: 'asc' },
                  },
                },
              },
              tenant: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          });

          const availabilityUpdate = await tx.property.updateMany({
            where: {
              id: booking.propertyId,
              lifecycleStatus: PropertyLifecycleStatus.BOOKED,
            },
            data: {
              lifecycleStatus: PropertyLifecycleStatus.OCCUPIED,
              isAvailable: false,
            },
          });

          if (availabilityUpdate.count !== 1) {
            throw new BadRequestException(
              'This property is no longer available.',
            );
          }

          return createdLease;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new BadRequestException(
          'Property availability changed concurrently. Please retry.',
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A lease already exists for this booking.',
        );
      }
      throw error;
    }

    await this.notificationsService.createNotification(
      lease.tenantId,
      'Lease Created',
      `Your lease for "${lease.property.title}" has been created successfully.`,
      NotificationType.GENERAL,
      lease.id,
    );

    await this.pushNotificationsService.sendToUser(
      lease.tenantId,
      'Lease Created',
      `Your lease for "${lease.property.title}" has been created successfully.`,
      {
        type: 'LEASE_CREATED',
        leaseId: lease.id,
        bookingId: lease.bookingId,
        propertyId: lease.propertyId,
      },
    );

    await this.notificationsService.createNotification(
      lease.property.owner.id,
      'Lease Created',
      `A lease has been created for "${lease.property.title}".`,
      NotificationType.GENERAL,
      lease.id,
    );

    await this.pushNotificationsService.sendToUser(
      lease.property.owner.id,
      'Lease Created',
      `A lease has been created for "${lease.property.title}".`,
      {
        type: 'LEASE_CREATED',
        leaseId: lease.id,
        bookingId: lease.bookingId,
        propertyId: lease.propertyId,
      },
    );

    return {
      success: true,
      message: 'Lease created successfully.',
      data: serializePrisma(lease),
    };
  }
  // =====================================
  // Tenant Leases
  // =====================================

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
    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const changed = await tx.lease.updateMany({ where: { id, status: LeaseStatus.ACTIVE }, data: { status: LeaseStatus.COMPLETED, completedAt: new Date() } });
        if (changed.count !== 1) throw new BadRequestException('Lease status changed; please retry.');
        await tx.property.update({ where: { id: lease.propertyId }, data: { lifecycleStatus: PropertyLifecycleStatus.PUBLISHED, isAvailable: true, isVerified: true } });
        return tx.lease.findUniqueOrThrow({ where: { id }, include: { property: true, tenant: true, booking: true } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new BadRequestException('Property availability changed concurrently. Please retry.');
      throw error;
    }
    await this.notificationsService.createNotification(lease.tenantId, 'Lease Completed', `Your lease for "${lease.property.title}" has been completed.`, NotificationType.GENERAL, lease.id);
    return { success: true, message: 'Lease completed successfully.', data: serializePrisma(updated) };
  }


  // =====================================
  // Terminate Lease
  // =====================================

  async terminate(id: string, user: any) {
    await this.expireOverdueLeases();
    const lease = await this.getLeaseForUpdate(id);
    const isTenant = lease.tenantId === user.id;
    const isOwner = lease.property.ownerId === user.id;
    if (!isTenant && !isOwner && user.role !== UserRole.ADMIN) throw new ForbiddenException('You do not have permission to terminate this lease.');
    if (lease.status !== LeaseStatus.ACTIVE) throw new BadRequestException(`Lease cannot be terminated from ${lease.status} status.`);
    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const changed = await tx.lease.updateMany({ where: { id, status: LeaseStatus.ACTIVE }, data: { status: LeaseStatus.TERMINATED, terminatedAt: new Date() } });
        if (changed.count !== 1) throw new BadRequestException('Lease status changed; please retry.');
        await tx.property.update({ where: { id: lease.propertyId }, data: { isAvailable: true } });
        return tx.lease.findUniqueOrThrow({ where: { id }, include: { property: true, tenant: true, booking: true } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new BadRequestException('Property availability changed concurrently. Please retry.');
      throw error;
    }
    await this.notificationsService.createNotification(lease.tenantId, 'Lease Terminated', `Your lease for "${lease.property.title}" has been terminated.`, NotificationType.GENERAL, lease.id);
    return { success: true, message: 'Lease terminated successfully.', data: serializePrisma(updated) };
  }


  // =====================================
  // Cancel Lease
  // =====================================

  async cancel(id: string, user: any) {
    await this.expireOverdueLeases();
    const lease = await this.getLeaseForUpdate(id);
    this.ensureOwnerOrAdmin(lease, user);
    if (lease.status !== LeaseStatus.ACTIVE) throw new BadRequestException(`Lease cannot be cancelled from ${lease.status} status.`);
    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const changed = await tx.lease.updateMany({ where: { id, status: LeaseStatus.ACTIVE }, data: { status: LeaseStatus.CANCELLED } });
        if (changed.count !== 1) throw new BadRequestException('Lease status changed; please retry.');
        await tx.property.update({ where: { id: lease.propertyId }, data: { isAvailable: true } });
        return tx.lease.findUniqueOrThrow({ where: { id }, include: { property: true, tenant: true, booking: true } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new BadRequestException('Property availability changed concurrently. Please retry.');
      throw error;
    }
    return { success: true, message: 'Lease cancelled successfully.', data: serializePrisma(updated) };
  }


  // =====================================
  // Internal Helpers
  // =====================================

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
