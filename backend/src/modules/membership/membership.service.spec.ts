jest.mock('razorpay', () => jest.fn());

import { BadRequestException } from '@nestjs/common';
import { MembershipService } from './membership.service';

describe('MembershipService', () => {
  let service: MembershipService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      membershipPlan: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      membership: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      billingAuditEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
    };

    service = new MembershipService(prisma);
  });

  it('uses the plan price as the membership billing amount', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'p1',
      price: 499,
      isActive: true,
    });
    prisma.membership.findFirst.mockResolvedValue(null);
    prisma.membership.create.mockResolvedValue({ id: 'm1' });

    await service.createMembership('u1', 'p1');

    expect(prisma.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: expect.anything() }),
      }),
    );
  });

  it('rejects activation of a paid membership before payment verification', async () => {
    prisma.membership.findUnique.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      status: 'PENDING',
      isTrial: false,
      paidAt: null,
      razorpayPaymentId: null,
      plan: { durationDays: 30 },
    });

    await expect(service.activateMembership('m1', { id: 'u1', role: 'USER' as any })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects auto-renew changes for another user', async () => {
    prisma.membership.findUnique.mockResolvedValue({
      id: 'm1',
      userId: 'owner-1',
      status: 'ACTIVE',
    });

    await expect(
      service.updateAutoRenew('m1', true, {
        id: 'other-user',
        role: 'USER' as any,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.membership.update).not.toHaveBeenCalled();
  });

  it('blocks a second active membership', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'p1',
      isActive: true,
      price: 99,
    });
    prisma.membership.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.createMembership('u1', 'p1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.membership.create).not.toHaveBeenCalled();
  });

  it('records billing reconciliation results in the audit trail', async () => {
    prisma.membership.findMany
      .mockResolvedValueOnce([{ id: 'pending-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'unpaid-1' }]);
    prisma.billingAuditEvent.create.mockResolvedValue({ id: 'audit-1' });

    const result = await service.reconcileBilling('admin-1');

    expect(result.pendingPaymentCount).toBe(1);
    expect(result.activeUnpaidCount).toBe(1);
    expect(prisma.billingAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'admin-1',
          action: 'BILLING_RECONCILIATION',
        }),
      }),
    );
  });
});
