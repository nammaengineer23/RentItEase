import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MembershipStatus, PropertyTransactionType, UserRole } from '@prisma/client';

import { PropertiesService } from './properties.service';

jest.mock('../../storage/storage.service', () => ({
  StorageService: class StorageService {},
}));

describe('PropertiesService public discovery and owner-contact privacy', () => {
  const property = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };
  const membership = {
    findFirst: jest.fn(),
  };
  const prisma = {
    property,
    membership,
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  } as any;

  const storage = { getPublicMediaDownloadUrl: jest.fn() };
  const pushNotifications = { sendToAdmins: jest.fn().mockResolvedValue({ queuedForAdmins: 1 }) };
  let service: PropertiesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(prisma, storage as any, pushNotifications as any);
  });

  function detailProperty(overrides: Record<string, any> = {}) {
    return {
      id: 'property-1',
      ownerId: 'owner-1',
      transactionType: PropertyTransactionType.RENT,
      isVerified: true,
      isAvailable: true,
      owner: { id: 'owner-1', fullName: 'Owner' },
      amenities: [],
      images: [],
      reviews: [],
      _count: { favorites: 0 },
      socialMediaPosts: [],
      viewCount: 3,
      ...overrides,
    };
  }

  it('submits a draft and queues admin notifications in the same transaction', async () => {
    property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'tenant-1', lifecycleStatus: 'DRAFT' });
    property.update.mockResolvedValue({ id: 'property-1', ownerId: 'tenant-1', title: 'Flat', transactionType: 'RENT', updatedAt: new Date('2026-11-26T10:00:00Z'), lifecycleStatus: 'SUBMITTED' });
    await expect(service.submit('property-1', { id: 'tenant-1' })).resolves.toMatchObject({ success: true });
    expect(pushNotifications.sendToAdmins).toHaveBeenCalledWith(expect.stringContaining('property-submission:property-1:'), 'Property approval required', expect.any(String), expect.objectContaining({ event: 'PROPERTY_SUBMITTED' }), expect.anything());
  });

  it('allows anonymous access to verified and available public listings', async () => {
    property.findUnique.mockResolvedValue(detailProperty());

    await expect(service.findOne('property-1')).resolves.toMatchObject({
      success: true,
      property: { id: 'property-1' },
    });
  });

  it('hides private listings from anonymous users and other users', async () => {
    property.findUnique.mockResolvedValue(
      detailProperty({ isVerified: false, isAvailable: false }),
    );

    await expect(service.findOne('property-1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.findOne('property-1', { id: 'tenant-1', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(storage.getPublicMediaDownloadUrl).not.toHaveBeenCalled();
  });

  it('allows an owner to view their own pending non-rental listing when marketplace is disabled', async () => {
    const previous = process.env.PROPERTY_MARKETPLACE_ENABLED;
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
    property.findUnique.mockResolvedValue(
      detailProperty({
        transactionType: PropertyTransactionType.SITE_SALE,
        isVerified: false,
        isAvailable: false,
      }),
    );

    try {
      await expect(
        service.findOne('property-1', { id: 'owner-1', role: UserRole.OWNER }),
      ).resolves.toMatchObject({ success: true, property: { id: 'property-1' } });
    } finally {
      if (previous === undefined) delete process.env.PROPERTY_MARKETPLACE_ENABLED;
      else process.env.PROPERTY_MARKETPLACE_ENABLED = previous;
    }
  });

  it('rejects a demoted owner from viewing their former private non-rental listing', async () => {
    const previous = process.env.PROPERTY_MARKETPLACE_ENABLED;
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
    property.findUnique.mockResolvedValue(
      detailProperty({
        transactionType: PropertyTransactionType.SITE_SALE,
        isVerified: false,
        isAvailable: false,
      }),
    );

    try {
      await expect(
        service.findOne('property-1', { id: 'owner-1', role: UserRole.USER }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(storage.getPublicMediaDownloadUrl).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.PROPERTY_MARKETPLACE_ENABLED;
      else process.env.PROPERTY_MARKETPLACE_ENABLED = previous;
    }
  });

  it('allows admins to view private non-rental listings when marketplace is disabled', async () => {
    const previous = process.env.PROPERTY_MARKETPLACE_ENABLED;
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
    property.findUnique.mockResolvedValue(
      detailProperty({
        transactionType: PropertyTransactionType.SITE_SALE,
        isVerified: false,
        isAvailable: false,
      }),
    );

    try {
      await expect(
        service.findOne('property-1', { id: 'admin-1', role: UserRole.ADMIN }),
      ).resolves.toMatchObject({ success: true, property: { id: 'property-1' } });
    } finally {
      if (previous === undefined) delete process.env.PROPERTY_MARKETPLACE_ENABLED;
      else process.env.PROPERTY_MARKETPLACE_ENABLED = previous;
    }
  });

  it('refreshes property image and video URLs from stable GCS keys', async () => {
    storage.getPublicMediaDownloadUrl
      .mockResolvedValueOnce('https://signed.example/image.jpg')
      .mockResolvedValueOnce('https://signed.example/video.mp4');

    const result = await (service as any).serializePublicProperty({
      id: 'property-1',
      videoUrl: 'https://expired.example/video.mp4',
      videoPublicId: 'property-videos/video.mp4',
      images: [{
        id: 'image-1',
        publicId: 'properties/image.jpg',
        imageUrl: 'https://expired.example/image.jpg',
      }],
    });

    expect(result.images[0].imageUrl).toBe('https://signed.example/image.jpg');
    expect(result.videoUrl).toBe('https://signed.example/video.mp4');
    expect(storage.getPublicMediaDownloadUrl).toHaveBeenNthCalledWith(1, 'properties/image.jpg');
    expect(storage.getPublicMediaDownloadUrl).toHaveBeenNthCalledWith(2, 'property-videos/video.mp4');
  });

  it('preserves legacy property media URLs when stable GCS keys are absent', async () => {
    const result = await (service as any).serializePublicProperty({
      videoUrl: 'https://legacy.example/video.mp4',
      videoPublicId: null,
      images: [{ publicId: null, imageUrl: 'https://legacy.example/image.jpg' }],
    });

    expect(result.videoUrl).toBe('https://legacy.example/video.mp4');
    expect(result.images[0].imageUrl).toBe('https://legacy.example/image.jpg');
    expect(storage.getPublicMediaDownloadUrl).not.toHaveBeenCalled();
  });

  it('rejects non-rental listing creation while the marketplace flag is off', async () => {
    const previous = process.env.PROPERTY_MARKETPLACE_ENABLED;
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
    try {
      await expect(
        service.create({ transactionType: 'SALE' } as any, { id: 'owner-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(property.create).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.PROPERTY_MARKETPLACE_ENABLED;
      else process.env.PROPERTY_MARKETPLACE_ENABLED = previous;
    }
  });

  it('omits private survey references from create responses', async () => {
    const previous = process.env.PROPERTY_MARKETPLACE_ENABLED;
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'true';
    property.create.mockResolvedValue({
      id: 'property-1',
      transactionType: PropertyTransactionType.SITE_SALE,
      surveyReference: 'PRIVATE-REFERENCE',
    });
    try {
      const result = await service.create(
        { transactionType: PropertyTransactionType.SITE_SALE, askingPrice: 100000, landArea: 100, landAreaUnit: 'SQ_FT' } as any,
        { id: 'owner-1' },
      );
      expect(result.property).not.toHaveProperty('surveyReference');
    } finally {
      if (previous === undefined) delete process.env.PROPERTY_MARKETPLACE_ENABLED;
      else process.env.PROPERTY_MARKETPLACE_ENABLED = previous;
    }
  });

  it('omits private survey references from the top-rated home collection', async () => {
    const previous = process.env.PROPERTY_MARKETPLACE_ENABLED;
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
    property.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        id: 'property-1',
        transactionType: PropertyTransactionType.RENT,
        surveyReference: 'PRIVATE-REFERENCE',
        reviews: [],
      }]);
    prisma.property.groupBy = jest.fn().mockResolvedValue([]);
    try {
      const result = await service.home();
      expect(result.topRated[0]).not.toHaveProperty('surveyReference');
    } finally {
      if (previous === undefined) delete process.env.PROPERTY_MARKETPLACE_ENABLED;
      else process.env.PROPERTY_MARKETPLACE_ENABLED = previous;
    }
  });

  it('limits every home collection to verified, available properties', async () => {
    property.findMany.mockResolvedValue([]);
    prisma.property.groupBy = jest.fn().mockResolvedValue([]);

    await service.home();

    for (const call of property.findMany.mock.calls) {
      expect(call[0].where).toEqual(
        expect.objectContaining({ isAvailable: true, isVerified: true, transactionType: 'RENT' }),
      );
    }
    expect(prisma.property.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          isVerified: true,
          transactionType: 'RENT',
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
      transactionType: PropertyTransactionType.RENT,
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
      transactionType: PropertyTransactionType.RENT,
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
