import { BadRequestException } from '@nestjs/common';
import { PropertyTransactionType } from '@prisma/client';
import { PropertiesService } from './properties.service';

describe('PropertiesService marketplace category validation', () => {
  const prisma = { property: { create: jest.fn() } } as any;
  let service: PropertiesService;
  const owner = { id: 'owner-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(prisma, {} as any);
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'true';
  });

  afterAll(() => {
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
  });

  it.each([
    ['SALE', { askingPrice: 0 }],
    ['SALE', { askingPrice: -100 }],
    ['SITE_SALE', { askingPrice: 0, landArea: 100, landAreaUnit: 'SQ_FT' }],
    ['SITE_SALE', { askingPrice: 100000, landArea: 0, landAreaUnit: 'SQ_FT' }],
    ['SITE_SALE', { askingPrice: 100000, landArea: 100 }],
    ['SITE_RENT', { price: 0, landArea: 100, landAreaUnit: 'SQ_FT' }],
    ['SITE_RENT', { price: 100, landArea: 0, landAreaUnit: 'SQ_FT' }],
    ['SITE_LEASE', { price: 0, leaseTermMonths: 12, landArea: 100, landAreaUnit: 'SQ_FT' }],
    ['SITE_LEASE', { price: 100, leaseTermMonths: 12, landArea: 100 }],
    ['SITE_LEASE', { leaseTermMonths: 0, landArea: 100, landAreaUnit: 'SQ_FT' }],
    ['LEASE', { leaseTermMonths: 0 }],
    ['LEASE', { leaseTermMonths: -12 }],
    ['RENT', { askingPrice: 100000 }],
    ['RENT', { leaseTermMonths: 12 }],
    ['RENT', { landArea: 100, landAreaUnit: 'SQ_FT' }],
    ['SALE', { askingPrice: 100000, leaseTermMonths: 12 }],
    ['SALE', { askingPrice: 100000, landArea: 100, landAreaUnit: 'SQ_FT' }],
    ['LEASE', { leaseTermMonths: 12, askingPrice: 100000 }],
    ['LEASE', { leaseTermMonths: 12, landArea: 100, landAreaUnit: 'SQ_FT' }],
    ['SITE_SALE', { askingPrice: 100000, landArea: 100, landAreaUnit: 'SQ_FT', leaseTermMonths: 12 }],
  ] as const)('rejects invalid %s fields', async (transactionType, fields) => {
    await expect(
      service.create({ transactionType: transactionType as PropertyTransactionType, ...fields } as any, owner),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.property.create).not.toHaveBeenCalled();
  });

  it('allows owners to create unpublished marketplace drafts while public discovery is disabled', async () => {
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'false';
    prisma.property.create.mockResolvedValue({ id: 'property-draft' });
    await service.create({
      transactionType: PropertyTransactionType.SALE,
      askingPrice: 100000,
    } as any, owner);
    expect(prisma.property.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        transactionType: PropertyTransactionType.SALE,
        isAvailable: false,
        isVerified: false,
        ownerId: owner.id,
      }),
    }));
  });

  it.each([
    ['SITE_RENT', { price: 25000, landArea: 1200, landAreaUnit: 'sq_ft' }],
    ['SITE_LEASE', { price: 25000, leaseTermMonths: 24, landArea: 1200, landAreaUnit: 'sq_ft' }],
  ] as const)('accepts valid %s drafts', async (transactionType, fields) => {
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'false';
    prisma.property.create.mockResolvedValue({ id: 'site-draft' });
    await service.create({ transactionType: transactionType as PropertyTransactionType, ...fields } as any, owner);
    expect(prisma.property.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ transactionType, isAvailable: false, isVerified: false }),
    }));
  });

  it('does not apply marketplace gating to existing RENT category', async () => {
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'false';
    prisma.property.create.mockResolvedValue({ id: 'property-1' });
    await service.create({ transactionType: PropertyTransactionType.RENT } as any, owner);
    expect(prisma.property.create).toHaveBeenCalled();
  });
});
