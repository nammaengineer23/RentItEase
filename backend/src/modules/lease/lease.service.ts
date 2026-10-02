import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BookingStatus,
  LeaseStatus,
  NotificationType,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

import { CreateLeaseDto } from './dto/create-lease.dto';

@Injectable()
export class LeaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  // =====================================
  // Create Lease From Paid Booking
  // =====================================

  async create(dto: CreateLeaseDto, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: dto.bookingId,
      },
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
        visit: true,
        lease: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

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
      throw new BadRequestException('A lease already exists for this booking.');
    }

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
        throw new BadRequestException(
          'Lease end date must be after the start date.',
        );
      }
    }

    const existingActiveLease = await this.prisma.lease.findFirst({
      where: {
        propertyId: booking.propertyId,
        status: LeaseStatus.ACTIVE,
      },
    });

    if (existingActiveLease) {
      throw new BadRequestException(
        'This property already has an active lease.',
      );
    }

    const lease = await this.prisma.lease.create({
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
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
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
      },
    });

    // Mark property as unavailable after lease creation.
    await this.prisma.property.update({
      where: {
        id: booking.propertyId,
      },
      data: {
        isAvailable: false,
      },
    });

    await this.notificationsService.createNotification(
      booking.tenantId,
      'Lease Created',
      `Your lease for "${booking.property.title}" has been created successfully.`,
      NotificationType.GENERAL,
      lease.id,
    );

    await this.pushNotificationsService.sendToUser(
      booking.tenantId,
      'Lease Created',
      `Your lease for "${booking.property.title}" has been created successfully.`,
      {
        type: 'LEASE_CREATED',
        leaseId: lease.id,
        bookingId: booking.id,
        propertyId: booking.propertyId,
      },
    );

    await this.notificationsService.createNotification(
      booking.property.owner.id,
      'Lease Created',
      `A lease has been created for "${booking.property.title}".`,
      NotificationType.GENERAL,
      lease.id,
    );

    await this.pushNotificationsService.sendToUser(
      booking.property.owner.id,
      'Lease Created',
      `A lease has been created for "${booking.property.title}".`,
      {
        type: 'LEASE_CREATED',
        leaseId: lease.id,
        bookingId: booking.id,
        propertyId: booking.propertyId,
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
    const leases = await this.prisma.lease.findMany({
      where: {
        tenantId: user.id,
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
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      total: leases.length,
      leases: serializePrisma(leases),
    };
  }

  // =====================================
  // Owner Leases
  // =====================================

  async getOwnerLeases(user: any) {
    const leases = await this.prisma.lease.findMany({
      where: {
        property: {
          ownerId: user.id,
        },
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
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      total: leases.length,
      leases: serializePrisma(leases),
    };
  }

  // =====================================
  // Get Lease
  // =====================================

  async findOne(id: string, user?: any) {
    const lease = await this.prisma.lease.findUnique({
      where: {
        id,
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
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
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
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found.');
    }

    if (
      user &&
      user.role !== UserRole.ADMIN &&
      lease.tenantId !== user.id &&
      lease.property.ownerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this lease.');
    }

    return {
      success: true,
      data: serializePrisma(lease),
    };
  }

  // =====================================
  // Complete Lease
  // =====================================

  async complete(id: string, user: any) {
    const lease = await this.getLeaseForUpdate(id);

    this.ensureOwnerOrAdmin(lease, user);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException(
        `Lease cannot be completed from ${lease.status} status.`,
      );
    }

    const updated = await this.prisma.lease.update({
      where: {
        id,
      },
      data: {
        status: LeaseStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.prisma.property.update({
      where: {
        id: lease.propertyId,
      },
      data: {
        isAvailable: true,
      },
    });

    await this.notificationsService.createNotification(
      lease.tenantId,
      'Lease Completed',
      `Your lease for "${lease.property.title}" has been completed.`,
      NotificationType.GENERAL,
      lease.id,
    );

    return {
      success: true,
      message: 'Lease completed successfully.',
      data: serializePrisma(updated),
    };
  }

  // =====================================
  // Terminate Lease
  // =====================================

  async terminate(id: string, user: any) {
    const lease = await this.getLeaseForUpdate(id);

    const isTenant = lease.tenantId === user.id;
    const isOwner = lease.property.ownerId === user.id;

    if (!isTenant && !isOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to terminate this lease.',
      );
    }

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException(
        `Lease cannot be terminated from ${lease.status} status.`,
      );
    }

    const updated = await this.prisma.lease.update({
      where: {
        id,
      },
      data: {
        status: LeaseStatus.TERMINATED,
        terminatedAt: new Date(),
      },
    });

    await this.prisma.property.update({
      where: {
        id: lease.propertyId,
      },
      data: {
        isAvailable: true,
      },
    });

    await this.notificationsService.createNotification(
      lease.tenantId,
      'Lease Terminated',
      `Your lease for "${lease.property.title}" has been terminated.`,
      NotificationType.GENERAL,
      lease.id,
    );

    return {
      success: true,
      message: 'Lease terminated successfully.',
      data: serializePrisma(updated),
    };
  }

  // =====================================
  // Cancel Lease
  // =====================================

  async cancel(id: string, user: any) {
    const lease = await this.getLeaseForUpdate(id);

    this.ensureOwnerOrAdmin(lease, user);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException(
        `Lease cannot be cancelled from ${lease.status} status.`,
      );
    }

    const updated = await this.prisma.lease.update({
      where: {
        id,
      },
      data: {
        status: LeaseStatus.CANCELLED,
      },
    });

    await this.prisma.property.update({
      where: {
        id: lease.propertyId,
      },
      data: {
        isAvailable: true,
      },
    });

    return {
      success: true,
      message: 'Lease cancelled successfully.',
      data: serializePrisma(updated),
    };
  }

  // =====================================
  // Internal Helpers
  // =====================================

  private async getLeaseForUpdate(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: {
        id,
      },
      include: {
        property: true,
        tenant: true,
        booking: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found.');
    }

    return lease;
  }

  private ensureOwnerOrAdmin(lease: any, user: any) {
    if (user.role !== UserRole.ADMIN && lease.property.ownerId !== user.id) {
      throw new ForbiddenException(
        'Only the property owner or admin can perform this action.',
      );
    }
  }
}
