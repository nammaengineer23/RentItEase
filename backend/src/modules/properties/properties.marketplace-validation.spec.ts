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

  it('rejects non-rental categories when the server feature flag is off', async () => {
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'false';
    await expect(
      service.create({ transactionType: PropertyTransactionType.SALE, askingPrice: 100000 } as any, owner),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.property.create).not.toHaveBeenCalled();
  });

  it('does not apply marketplace gating to existing RENT category', async () => {
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'false';
    prisma.property.create.mockResolvedValue({ id: 'property-1' });
    await service.create({ transactionType: PropertyTransactionType.RENT } as any, owner);
    expect(prisma.property.create).toHaveBeenCalled();
  });
});
