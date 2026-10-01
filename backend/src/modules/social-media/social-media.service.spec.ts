import { BadRequestException } from '@nestjs/common';

import { SocialMediaService } from './social-media.service';

describe('SocialMediaService social publishing security', () => {
  const prisma: any = {
    socialMarketingConsent: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    socialMediaPost: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    socialMediaAuditEvent: { create: jest.fn() },
    socialMediaSetting: { findUnique: jest.fn(), upsert: jest.fn() },
    socialAnalyticsSnapshot: { findMany: jest.fn(), create: jest.fn() },
    property: { findFirst: jest.fn(), findUnique: jest.fn() },
  };

  const storage: any = {
    cleanupTempFile: jest.fn(),
    downloadVideo: jest.fn(),
    importRemoteVideo: jest.fn(),
    deleteStoredVideo: jest.fn(),
  };

  const publishing: any = { publish: jest.fn() };
  const remotion: any = { generate: jest.fn() };
  const template: any = {
    buildPlatformCaption: jest.fn(() => 'safe caption'),
    buildTitle: jest.fn(() => 'safe title'),
  };

  const service = new SocialMediaService(
    prisma,
    remotion,
    publishing,
    storage,
    template,
  );

  beforeEach(() => jest.clearAllMocks());

  it('blocks publishing when owner consent is absent', async () => {
    prisma.socialMarketingConsent.findUnique.mockResolvedValue(null);

    await expect(
      service.publish({
        propertyId: 'property-1',
        actorId: 'admin-1',
        platform: 'INSTAGRAM',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks publishing when consent has been revoked', async () => {
    prisma.socialMarketingConsent.findUnique
      .mockResolvedValueOnce({
        id: 'consent-1',
        approved: true,
        preparedAt: new Date('2026-09-30T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'consent-1',
        approved: false,
        preparedVideoUrl: 'https://storage.googleapis.com/bucket/social-videos/p.mp4',
      });

    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      title: 'Test property',
      description: 'Safe description',
      price: 10000,
      city: 'Bengaluru',
      locality: 'Whitefield',
      bedrooms: 2,
      bathrooms: 2,
      area: 1000,
      propertyType: 'APARTMENT',
      furnishing: 'FULLY_FURNISHED',
      parking: true,
      petFriendly: false,
      address: 'Test address',
      images: [],
    });
    prisma.socialMediaPost.upsert.mockResolvedValue({
      id: 'post-1',
      propertyId: 'property-1',
      platform: 'INSTAGRAM',
      status: 'PENDING',
    });
    prisma.socialMediaPost.updateMany.mockResolvedValue({ count: 1 });
    prisma.socialMediaAuditEvent.create.mockResolvedValue({});

    await service.saveOwnerConsent({
      propertyId: 'property-1',
      ownerId: 'owner-1',
      approved: false,
    });

    expect(prisma.socialMediaPost.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyId: 'property-1',
          status: expect.objectContaining({ in: ['PENDING', 'READY', 'FAILED'] }),
        }),
      }),
    );
  });

  it('cancels pending, ready and failed publications when consent is revoked', async () => {
    prisma.property.findFirst.mockResolvedValue({ id: 'property-1' });
    prisma.socialMarketingConsent.upsert.mockResolvedValue({
      id: 'consent-1',
      approved: false,
      consentVersion: '1.0',
    });
    prisma.socialMediaPost.updateMany.mockResolvedValue({ count: 3 });
    prisma.socialMediaAuditEvent.create.mockResolvedValue({});

    await service.saveOwnerConsent({
      propertyId: 'property-1',
      ownerId: 'owner-1',
      approved: false,
    });

    expect(prisma.socialMediaPost.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CANCELLED',
          scheduledAt: null,
          nextRetryAt: null,
          processingToken: null,
          processingLeaseUntil: null,
        }),
      }),
    );
    expect(prisma.socialMediaAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'CONSENT_REVOKED_POSTS_CANCELLED',
        }),
      }),
    );
  });

  it('rejects unsafe social content and excessive hashtags', () => {
    expect(() =>
      (service as any).validatePlatformContent(
        'INSTAGRAM',
        'javascript:alert(1)',
        'safe',
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      (service as any).validatePlatformContent(
        'INSTAGRAM',
        'Safe title',
        Array.from({ length: 31 }, (_, i) => `#tag${i}`).join(' '),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects content above the selected platform caption limit', () => {
    expect(() =>
      (service as any).validatePlatformContent(
        'INSTAGRAM',
        'Safe title',
        'x'.repeat(2201),
      ),
    ).toThrow(BadRequestException);
  });

  it('persists settings but never enables automatic publishing', async () => {
    prisma.socialMediaSetting.upsert.mockResolvedValue({});

    const result = await service.updateSettings({ mode: 'GENERATE_ONLY' });

    expect(result).toEqual(
      expect.objectContaining({
        persisted: true,
        automaticPublishing: false,
      }),
    );
    expect(prisma.socialMediaSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          value: expect.objectContaining({ automaticPublishing: false }),
        }),
      }),
    );
  });

  it('requires future scheduling times', async () => {
    await expect(
      service.schedule({
        propertyId: 'property-1',
        actorId: 'admin-1',
        platform: 'INSTAGRAM',
        scheduledAt: new Date(Date.now() - 1000),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps provider credentials out of persisted audit details', async () => {
    prisma.socialMediaAuditEvent.create.mockResolvedValue({});
    await (service as any).audit('property-1', 'admin-1', 'TEST', 'post-1', {
      externalId: 'provider-id',
      platform: 'INSTAGRAM',
    });

    const details = prisma.socialMediaAuditEvent.create.mock.calls[0][0].data.details;
    expect(JSON.stringify(details)).not.toMatch(/access_token|refresh_token|Bearer/i);
  });
});
