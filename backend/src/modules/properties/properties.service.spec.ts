import { ForbiddenException } from '@nestjs/common';
import { MembershipStatus, UserRole } from '@prisma/client';

import { PropertiesService } from './properties.service';

describe('PropertiesService public discovery and owner-contact privacy', () => {
  const property = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };
  const membership = {
    findFirst: jest.fn(),
  };
  const prisma = {
    property,
    membership,
  } as any;

  let service: PropertiesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(prisma);
  });

  it('limits every home collection to verified, available properties', async () => {
    property.findMany.mockResolvedValue([]);
    prisma.property.groupBy = jest.fn().mockResolvedValue([]);

    await service.home();

    for (const call of property.findMany.mock.calls) {
      expect(call[0].where).toEqual(
        expect.objectContaining({ isAvailable: true, isVerified: true }),
      );
    }
    expect(prisma.property.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          isVerified: true,
        }),
      }),
    );
  });

  it('limits nearby properties to verified, available properties', async () => {
    property.findMany.mockResolvedValue([]);

    await service.findNearby({ latitude: 12.9, longitude: 77.6 });

    expect(property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          isVerified: true,
        }),
      }),
    );
  });

  it('does not expose owner contact without an active membership', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      isVerified: true,
      owner: {
        id: 'owner-1',
        fullName: 'Owner',
        email: 'owner@example.com',
        phone: '+919999999999',
      },
    });
    membership.findFirst.mockResolvedValue(null);

    await expect(
      service.getOwnerContact('property-1', {
        id: 'tenant-1',
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(membership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'tenant-1',
          status: MembershipStatus.ACTIVE,
        }),
      }),
    );
  });

  it('returns owner contact to an active member', async () => {
    const owner = {
      id: 'owner-1',
      fullName: 'Owner',
      email: 'owner@example.com',
      phone: '+919999999999',
    };
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: owner.id,
      isVerified: true,
      owner,
    });
    membership.findFirst.mockResolvedValue({ id: 'membership-1' });

    await expect(
      service.getOwnerContact('property-1', {
        id: 'tenant-1',
        role: UserRole.USER,
      }),
    ).resolves.toEqual({ success: true, data: owner });
  });
});
