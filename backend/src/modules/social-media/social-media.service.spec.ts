import { BadRequestException } from '@nestjs/common';

import { SocialMediaService } from './social-media.service';

describe('SocialMediaService consent-gated publishing', () => {
  const prisma: any = {
    socialMarketingConsent: { findUnique: jest.fn(), upsert: jest.fn() },
    socialMediaPost: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    socialMediaAuditEvent: { create: jest.fn() },
    socialMediaSetting: { findUnique: jest.fn(), upsert: jest.fn() },
    socialAnalyticsSnapshot: { findMany: jest.fn(), create: jest.fn() },
    property: { findFirst: jest.fn() },
  };
  const service = new SocialMediaService(prisma, {} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('blocks administrator publishing without general owner consent', async () => {
    prisma.socialMarketingConsent.findUnique.mockResolvedValue(null);

    await expect(
      service.publish({ propertyId: 'property-1', actorId: 'admin-1', platform: 'INSTAGRAM' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists settings but never enables automatic publishing', async () => {
    prisma.socialMediaSetting.upsert.mockResolvedValue({});

    const result = await service.updateSettings({ mode: 'GENERATE_ONLY' });

    expect(result).toEqual(expect.objectContaining({ persisted: true, automaticPublishing: false }));
    expect(prisma.socialMediaSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ value: expect.objectContaining({ automaticPublishing: false }) }) }),
    );
  });
});
