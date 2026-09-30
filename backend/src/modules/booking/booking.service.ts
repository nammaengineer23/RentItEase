import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BookingStatus,
  NotificationType,
  UserRole,
  VisitStatus,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

import { CreateBookingDto } from './dto/create-booking.dto';
import { assertBookingTransition } from './booking-state-machine';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  // =====================================
  // Create Booking From Approved Visit
  // =====================================

  async create(dto: CreateBookingDto, user: any) {
    const visit = await this.prisma.propertyVisit.findUnique({
      where: {
        id: dto.visitId,
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
        booking: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Property visit not found.');
    }

    if (![UserRole.USER, UserRole.OWNER].includes(user.role)) {
      throw new ForbiddenException('Only eligible tenant accounts can create bookings.');
    }

    if (visit.tenantId !== user.id) {
      throw new ForbiddenException(
        'You can only create a booking for your own visit.',
      );
    }

    if (visit.property.ownerId === user.id) {
      throw new BadRequestException(
        'You cannot book your own property.',
      );
    }

    if (visit.status !== VisitStatus.APPROVED) {
      throw new BadRequestException(
        'Booking can only be created for an approved property visit.',
      );
    }

    if (visit.booking) {
      throw new BadRequestException(
        'A booking already exists for this property visit.',
      );
    }

    if (!visit.property.isAvailable) {
      throw new BadRequestException('This property is no longer available.');
    }

    if (!visit.property.isVerified) {
      throw new BadRequestException('This property is not verified for booking.');
    }

    if (visit.visitDate.getTime() <= Date.now()) {
      throw new BadRequestException('The requested visit date has already passed.');
    }

    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId: visit.propertyId,
        tenantId: user.id,
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.APPROVED,
            BookingStatus.PAYMENT_PENDING,
            BookingStatus.PAID,
          ],
        },
      },
    });

    if (existingBooking) {
      throw new BadRequestException(
        'You already have an active booking for this property.',
      );
    }

    let booking: any;
    try {
      booking = await this.prisma.booking.create({
      data: {
        propertyId: visit.propertyId,
        tenantId: user.id,
        visitId: visit.id,
        monthlyRent: visit.property.price,
        securityDeposit: visit.property.securityDeposit,
        notes: dto.notes,
        activePropertyKey: visit.propertyId,
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
        visit: true,
      },
    });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('This property already has an active booking.');
      }
      throw error;
    }

    await this.notificationsService.createNotification(
      visit.property.owner.id,
      'New Booking Request',
      `${visit.tenant.fullName} requested to book "${visit.property.title}".`,
      NotificationType.GENERAL,
      booking.id,
    );

    await this.pushNotificationsService.sendToUser(
      visit.property.owner.id,
      'New Booking Request',
      `${visit.tenant.fullName} requested to book "${visit.property.title}".`,
      {
        type: 'BOOKING_REQUEST',
        bookingId: booking.id,
        propertyId: visit.property.id,
        visitId: visit.id,
      },
    );

    return {
      success: true,
      message: 'Booking created successfully.',
      data: serializePrisma(booking),
    };
  }

  // =====================================
  // Tenant Bookings
  // =====================================

  async getTenantBookings(user: any) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId: user.id,
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
        visit: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      total: bookings.length,
      bookings: serializePrisma(bookings),
    };
  }

  // =====================================
  // Owner Bookings
  // =====================================

  async getOwnerBookings(user: any) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        property: {
          ownerId: user.id,
        },
      },
      include: {
        property: {
          include: {
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
        visit: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      total: bookings.length,
      bookings: serializePrisma(bookings),
    };
  }

  // =====================================
  // Get Booking
  // =====================================

  async findOne(id: string, user?: any) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
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
        visit: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (
      user &&
      user.role !== UserRole.ADMIN &&
      booking.tenantId !== user.id &&
      booking.property.ownerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this booking.');
    }

    return {
      success: true,
      data: serializePrisma(booking),
    };
  }

  // =====================================
  // Owner Approves Booking
  // =====================================

  async approve(id: string, user: any) {
    const booking = await this.getBookingForUpdate(id);

    this.ensureOwner(booking, user);

    assertBookingTransition(booking.status, BookingStatus.APPROVED);

    if (!booking.property.isAvailable) {
      throw new BadRequestException(
        'This property is no longer available for booking.',
      );
    }

    const result = await this.prisma.booking.updateMany({
      where: { id, status: BookingStatus.PENDING },
      data: { status: BookingStatus.APPROVED, approvedAt: new Date() },
    });
    if (result.count !== 1) throw new BadRequestException('Booking status changed before approval could be completed.');

    const updated = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        visit: true,
      },
    });

    await this.notificationsService.createNotification(
      booking.tenantId,
      'Booking Approved',
      `Your booking request for "${booking.property.title}" has been approved.`,
      NotificationType.GENERAL,
      booking.id,
    );

    await this.pushNotificationsService.sendToUser(
      booking.tenantId,
      'Booking Approved',
      `Your booking request for "${booking.property.title}" has been approved.`,
      {
        type: 'BOOKING_APPROVED',
        bookingId: booking.id,
        propertyId: booking.propertyId,
      },
    );

    return {
      success: true,
      message: 'Booking approved successfully.',
      data: serializePrisma(updated),
    };
  }

  // =====================================
  // Owner Rejects Booking
  // =====================================

  async reject(id: string, user: any) {
    const booking = await this.getBookingForUpdate(id);

    this.ensureOwner(booking, user);

    assertBookingTransition(booking.status, BookingStatus.REJECTED);

    const result = await this.prisma.booking.updateMany({
      where: { id, status: BookingStatus.PENDING },
      data: { status: BookingStatus.REJECTED, activePropertyKey: null },
    });
    if (result.count !== 1) throw new BadRequestException('Booking status changed before rejection could be completed.');

    const updated = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        visit: true,
      },
    });

    await this.notificationsService.createNotification(
      booking.tenantId,
      'Booking Rejected',
      `Your booking request for "${booking.property.title}" was rejected.`,
      NotificationType.GENERAL,
      booking.id,
    );

    await this.pushNotificationsService.sendToUser(
      booking.tenantId,
      'Booking Rejected',
      `Your booking request for "${booking.property.title}" was rejected.`,
      {
        type: 'BOOKING_REJECTED',
        bookingId: booking.id,
        propertyId: booking.propertyId,
      },
    );

    return {
      success: true,
      message: 'Booking rejected successfully.',
      data: serializePrisma(updated),
    };
  }

  // =====================================
  // Move Approved Booking To Payment
  // =====================================

  async markPaymentPending(id: string, user: any) {
    const booking = await this.getBookingForUpdate(id);

    this.ensureTenant(booking, user);

    assertBookingTransition(booking.status, BookingStatus.PAYMENT_PENDING);

    const result = await this.prisma.booking.updateMany({
      where: { id, status: BookingStatus.APPROVED },
      data: { status: BookingStatus.PAYMENT_PENDING },
    });
    if (result.count !== 1) throw new BadRequestException('Booking status changed before payment could be started.');
    const updated = await this.prisma.booking.findUnique({ where: { id } });

    return {
      success: true,
      message: 'Booking moved to payment pending.',
      data: serializePrisma(updated),
    };
  }

  // =====================================
// Cancel Booking
// =====================================

async cancel(id: string, user: any) {
  const booking = await this.getBookingForUpdate(id);

  const isTenant = booking.tenantId === user.id;
  const isOwner = booking.property.ownerId === user.id;

  if (!isTenant && !isOwner && user.role !== UserRole.ADMIN) {
    throw new ForbiddenException(
      'You do not have permission to cancel this booking.',
    );
  }

  const cancellableStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.APPROVED,
    BookingStatus.PAYMENT_PENDING,
  ];

  if (!cancellableStatuses.includes(booking.status)) {
    throw new BadRequestException(
      `Booking cannot be cancelled from ${booking.status} status.`,
    );
  }

  const result = await this.prisma.booking.updateMany({
    where: { id, status: booking.status },
    data: { status: BookingStatus.CANCELLED, cancelledAt: new Date(), activePropertyKey: null },
  });
  if (result.count !== 1) throw new BadRequestException('Booking status changed before cancellation could be completed.');
  const updated = await this.prisma.booking.findUnique({ where: { id } });

  return {
    success: true,
    message: 'Booking cancelled successfully.',
    data: serializePrisma(updated),
  };
}

  // =====================================
  // Complete Booking
  // =====================================

  async complete(id: string, user: any) {
    const booking = await this.getBookingForUpdate(id);

    this.ensureOwner(booking, user);

    assertBookingTransition(booking.status, BookingStatus.COMPLETED);

    const result = await this.prisma.booking.updateMany({
      where: { id, status: BookingStatus.PAID },
      data: { status: BookingStatus.COMPLETED, completedAt: new Date(), activePropertyKey: null },
    });
    if (result.count !== 1) throw new BadRequestException('Booking status changed before completion could be completed.');
    const updated = await this.prisma.booking.findUnique({ where: { id } });

    return {
      success: true,
      message: 'Booking completed successfully.',
      data: serializePrisma(updated),
    };
  }

  // =====================================
  // Internal Helpers
  // =====================================

  private async getBookingForUpdate(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        property: true,
        tenant: true,
        visit: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    return booking;
  }

  private ensureOwner(booking: any, user: any) {
    if (user.role !== UserRole.ADMIN && booking.property.ownerId !== user.id) {
      throw new ForbiddenException(
        'Only the property owner can perform this action.',
      );
    }
  }

  private ensureTenant(booking: any, user: any) {
    if (user.role !== UserRole.ADMIN && booking.tenantId !== user.id) {
      throw new ForbiddenException(
        'Only the booking tenant can perform this action.',
      );
    }
  }
}
