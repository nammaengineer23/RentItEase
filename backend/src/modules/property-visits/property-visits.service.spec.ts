import { BadRequestException, ForbiddenException } from '@nestjs/common';

// Keep unit tests isolated from Firebase/JWKS ESM dependencies pulled in by push notifications.
jest.mock('../push-notifications/push-notifications.service', () => ({
  PushNotificationsService: class PushNotificationsService {},
}));
import { PropertyVisitsService } from './property-visits.service';
import { VisitStatus, UserRole } from '@prisma/client';

describe('PropertyVisitsService — Phase 10 hardening', () => {
  let service: PropertyVisitsService;
  let prisma: any;
  let mail: any;
  let notifications: any;
  let push: any;

  beforeEach(() => {
    prisma = {
      property: { findUnique: jest.fn() },
      propertyVisit: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) =>
        callback({
          propertyVisit: prisma.propertyVisit,
        }),
      ),
    };
    mail = {};
    notifications = { createNotification: jest.fn().mockResolvedValue(undefined) };
    push = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    service = new PropertyVisitsService(
      prisma,
      mail,
      notifications,
      push,
    );
  });

  it('prevents duplicate active visits inside the atomic create transaction', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      isVerified: true,
      isAvailable: true,
    });
    prisma.propertyVisit.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create(
        { propertyId: 'property-1', visitDate: future.toISOString() },
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.propertyVisit.create).not.toHaveBeenCalled();
  });

  it('rejects moving a pending visit into the past', async () => {
    prisma.propertyVisit.findUnique.mockResolvedValue({
      id: 'visit-1',
      tenantId: 'tenant-1',
      status: VisitStatus.PENDING,
      visitDate: new Date(Date.now() + 60 * 60 * 1000),
      property: { id: 'property-1', ownerId: 'owner-1', title: 'Test' },
    });

    await expect(
      service.update(
        'visit-1',
        { visitDate: new Date(Date.now() - 60 * 1000).toISOString() },
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a stale completion transition after another actor changed the state', async () => {
    prisma.propertyVisit.findUnique.mockResolvedValue({
      id: 'visit-1',
      tenantId: 'tenant-1',
      status: VisitStatus.APPROVED,
      property: { id: 'property-1', ownerId: 'owner-1', title: 'Test' },
    });
    prisma.propertyVisit.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.completeVisit(
        'visit-1',
        { id: 'owner-1', role: UserRole.OWNER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks unrelated users from owner visit management', async () => {
    prisma.propertyVisit.findUnique.mockResolvedValue({
      id: 'visit-1',
      tenantId: 'tenant-1',
      status: VisitStatus.PENDING,
      property: { id: 'property-1', ownerId: 'owner-1', title: 'Test' },
    });

    await expect(
      service.approveVisit(
        'visit-1',
        { id: 'other-user', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
