import { ForbiddenException } from '@nestjs/common';
import { MembershipService } from './membership.service';

describe('MembershipService authorization', () => {
  const prisma = {
    membership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  let service: MembershipService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MembershipService(prisma);
  });

  it('rejects a user reading another user membership collection', async () => {
    await expect(
      service.getUserMemberships('user-b', { id: 'user-a', role: 'USER' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.membership.findMany).not.toHaveBeenCalled();
  });

  it('rejects a user reading another user membership by id', async () => {
    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-b',
      userId: 'user-b',
      plan: {},
      user: { id: 'user-b' },
    });

    await expect(
      service.getMembership('membership-b', { id: 'user-a', role: 'USER' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the membership owner to change auto-renew', async () => {
    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-a',
      userId: 'user-a',
    });
    prisma.membership.update.mockResolvedValue({
      id: 'membership-a',
      userId: 'user-a',
      plan: {},
    });

    await expect(
      service.updateAutoRenew('membership-a', true, { id: 'user-a', role: 'USER' } as any),
    ).resolves.toEqual(expect.objectContaining({ id: 'membership-a' }));

    expect(prisma.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'membership-a' },
        data: { autoRenew: true },
      }),
    );
  });

  it('allows an admin to inspect another user membership', async () => {
    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-b',
      userId: 'user-b',
      plan: {},
      user: { id: 'user-b' },
    });

    await expect(
      service.getMembership('membership-b', { id: 'admin', role: 'ADMIN' } as any),
    ).resolves.toEqual(expect.objectContaining({ id: 'membership-b' }));
  });
});
