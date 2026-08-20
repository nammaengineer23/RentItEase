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

    if (visit.tenantId !== user.id) {
      throw new ForbiddenException(
        'You can only create a booking for your own visit.',
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

    const booking = await this.prisma.booking.create({
      data: {
        propertyId: visit.propertyId,
        tenantId: user.id,
        visitId: visit.id,
        monthlyRent: visit.property.price,
        securityDeposit: visit.property.securityDeposit,
        notes: dto.notes,
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

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Booking cannot be approved from ${booking.status} status.`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: BookingStatus.APPROVED,
        approvedAt: new Date(),
      },
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

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Booking cannot be rejected from ${booking.status} status.`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: BookingStatus.REJECTED,
      },
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

    if (booking.status !== BookingStatus.APPROVED) {
      throw new BadRequestException(
        'Only an approved booking can move to payment.',
      );
    }

    const updated = await this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: BookingStatus.PAYMENT_PENDING,
      },
    });

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

  const updated = await this.prisma.booking.update({
    where: {
      id,
    },
    data: {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });

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

    if (booking.status !== BookingStatus.PAID) {
      throw new BadRequestException('Only a paid booking can be completed.');
    }

    const updated = await this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

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
