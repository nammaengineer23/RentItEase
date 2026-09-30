import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BookingStatus, LeaseStatus, PaymentStatus, UserRole } from '@prisma/client';

import { LeaseService } from './lease.service';

describe('LeaseService security boundaries', () => {
  const prisma = {
    booking: { findUnique: jest.fn() },
    lease: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    invoice: { findFirst: jest.fn() },
    property: { update: jest.fn() },
    $transaction: jest.fn(),
  } as any;

  const notifications = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  } as any;

  const push = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  } as any;

  let service: LeaseService;

  const booking = () => ({
    id: 'booking-1',
    tenantId: 'tenant-1',
    propertyId: 'property-1',
    status: BookingStatus.PAID,
    monthlyRent: '25000',
    securityDeposit: '50000',
    bookingDate: new Date('2026-09-01T00:00:00.000Z'),
    payment: {
      id: 'payment-1',
      status: PaymentStatus.SUCCESS,
    },
    lease: null,
    property: {
      id: 'property-1',
      title: 'Secure Home',
      ownerId: 'owner-1',
      price: '25000',
      securityDeposit: '50000',
      owner: { id: 'owner-1', fullName: 'Owner' },
    },
    tenant: { id: 'tenant-1', fullName: 'Tenant' },
    visit: {},
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.lease.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));
    service = new LeaseService(prisma, notifications, push);
  });

  it('creates a lease only from the authenticated tenant\'s paid booking', async () => {
    const created = {
      id: 'lease-1',
      tenantId: 'tenant-1',
      propertyId: 'property-1',
      status: LeaseStatus.ACTIVE,
      property: booking().property,
      payment: booking().payment,
      invoice: { id: 'invoice-1', userId: 'tenant-1', status: 'PAID' },
      tenant: booking().tenant,
    };

    prisma.booking.findUnique.mockResolvedValue(booking());
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      userId: 'tenant-1',
      totalAmount: '25000',
      status: 'PAID',
    });
    prisma.lease.findFirst.mockResolvedValue(null);
    prisma.lease.create.mockResolvedValue(created);
    prisma.property.update.mockResolvedValue({});

    const result = await service.create(
      {
        bookingId: 'booking-1',
        startDate: '2026-09-02T00:00:00.000Z',
        endDate: '2027-09-01T00:00:00.000Z',
      },
      { id: 'tenant-1', role: UserRole.USER },
    );

    expect(result.data).toEqual(created);
    expect(prisma.lease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 'booking-1',
          tenantId: 'tenant-1',
          paymentId: 'payment-1',
          invoiceId: 'invoice-1',
          monthlyRent: '25000',
          securityDeposit: '50000',
          status: LeaseStatus.ACTIVE,
        }),
      }),
    );
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      data: { isAvailable: false },
    });
  });

  it('rejects a lease creation request for another tenant\'s booking', async () => {
    prisma.booking.findUnique.mockResolvedValue(booking());

    await expect(
      service.create(
        {
          bookingId: 'booking-1',
          startDate: '2026-09-02T00:00:00.000Z',
        },
        { id: 'attacker', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects unpaid bookings and inconsistent financial snapshots', async () => {
    const unpaid = booking();
    unpaid.status = BookingStatus.APPROVED;
    prisma.booking.findUnique.mockResolvedValue(unpaid);

    await expect(
      service.create(
        {
          bookingId: 'booking-1',
          startDate: '2026-09-02T00:00:00.000Z',
        },
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toThrow('paid booking');

    const inconsistent = booking();
    inconsistent.property.price = '26000';
    prisma.booking.findUnique.mockResolvedValue(inconsistent);

    await expect(
      service.create(
        {
          bookingId: 'booking-1',
          startDate: '2026-09-02T00:00:00.000Z',
        },
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toThrow('rent does not match');
  });

  it('rejects lease dates that predate the booking or have an invalid range', async () => {
    prisma.booking.findUnique.mockResolvedValue(booking());

    await expect(
      service.create(
        {
          bookingId: 'booking-1',
          startDate: '2026-08-31T00:00:00.000Z',
        },
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toThrow('cannot be before');

    const invalid = booking();
    prisma.booking.findUnique.mockResolvedValue(invalid);
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      userId: 'tenant-1',
      status: 'PAID',
    });
    prisma.lease.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        {
          bookingId: 'booking-1',
          startDate: '2026-09-02T00:00:00.000Z',
          endDate: '2026-09-01T00:00:00.000Z',
        },
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toThrow('must be after');
  });

  it('prevents an unrelated user from terminating a lease', async () => {
    prisma.lease.findUnique.mockResolvedValue({
      id: 'lease-1',
      tenantId: 'tenant-1',
      status: LeaseStatus.ACTIVE,
      propertyId: 'property-1',
      property: { id: 'property-1', ownerId: 'owner-1', title: 'Home' },
      tenant: { id: 'tenant-1' },
      booking: {},
      payment: {},
      invoice: {},
    });

    await expect(
      service.terminate('lease-1', { id: 'attacker', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows renewal only to a lease participant and only by extending the end date', async () => {
    prisma.lease.findUnique.mockResolvedValue({
      id: 'lease-1',
      tenantId: 'tenant-1',
      status: LeaseStatus.ACTIVE,
      endDate: new Date('2027-01-01T00:00:00.000Z'),
      propertyId: 'property-1',
      property: { id: 'property-1', ownerId: 'owner-1', title: 'Home' },
      tenant: { id: 'tenant-1' },
      booking: {},
      payment: {},
      invoice: {},
    });

    await expect(
      service.renew(
        'lease-1',
        { endDate: '2027-02-01T00:00:00.000Z' },
        { id: 'attacker', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.lease.updateMany.mockResolvedValue({ count: 1 });
    prisma.lease.findUniqueOrThrow.mockResolvedValue({
      id: 'lease-1',
      tenantId: 'tenant-1',
      status: LeaseStatus.ACTIVE,
      endDate: new Date('2027-02-01T00:00:00.000Z'),
      property: { id: 'property-1', ownerId: 'owner-1', title: 'Home' },
    });

    await service.renew(
      'lease-1',
      { endDate: '2027-02-02T00:00:00.000Z' },
      { id: 'tenant-1', role: UserRole.USER },
    );

    expect(prisma.lease.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lease-1', status: LeaseStatus.ACTIVE },
        data: expect.objectContaining({ renewalCount: { increment: 1 } }),
      }),
    );
  });

  it('expires overdue active leases and makes the property available', async () => {
    prisma.lease.findMany.mockResolvedValue([
      {
        id: 'lease-1',
        tenantId: 'tenant-1',
        propertyId: 'property-1',
        property: { id: 'property-1', ownerId: 'owner-1', title: 'Home' },
      },
    ]);
    prisma.lease.updateMany.mockResolvedValue({ count: 1 });
    prisma.property.update.mockResolvedValue({});

    const result = await service.expireOverdueLeases();

    expect(result.expired).toBe(1);
    expect(prisma.lease.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'lease-1',
          status: LeaseStatus.ACTIVE,
        }),
        data: expect.objectContaining({ status: LeaseStatus.EXPIRED }),
      }),
    );
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      data: { isAvailable: true },
    });
  });

  it('does not allow cancellation after the lease has started', async () => {
    prisma.lease.findUnique.mockResolvedValue({
      id: 'lease-1',
      tenantId: 'tenant-1',
      status: LeaseStatus.ACTIVE,
      startDate: new Date(Date.now() - 60_000),
      propertyId: 'property-1',
      property: { id: 'property-1', ownerId: 'owner-1', title: 'Home' },
      tenant: { id: 'tenant-1' },
      booking: {},
      payment: {},
      invoice: {},
    });

    await expect(
      service.cancel('lease-1', { id: 'owner-1', role: UserRole.OWNER }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
