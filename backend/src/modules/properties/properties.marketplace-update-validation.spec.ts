import { BadRequestException } from '@nestjs/common';
import { PropertyTransactionType, UserRole } from '@prisma/client';
import { PropertiesService } from './properties.service';

describe('PropertiesService marketplace category changes', () => {
  const prisma = {
    property: { findUnique: jest.fn(), update: jest.fn() },
  };
  const storage = {} as any;
  let service: PropertiesService;
  const owner = { id: 'owner-1', role: UserRole.OWNER };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(prisma as any, storage);
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'true';
    prisma.property.findUnique.mockResolvedValue({
      id: 'p1',
      ownerId: owner.id,
      transactionType: PropertyTransactionType.SALE,
      askingPrice: 250000,
      priceNegotiable: true,
      leaseTermMonths: null,
      leaseRenewalTerms: null,
      landArea: null,
      landAreaUnit: null,
      isVerified: true,
      isAvailable: false,
      amenities: [],
    });
    prisma.property.update.mockResolvedValue({ id: 'p1', transactionType: PropertyTransactionType.LEASE });
  });

  afterAll(() => {
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
  });

  it('requires new category-specific fields when changing from SALE to LEASE', async () => {
    await expect(service.update('p1', {
      transactionType: PropertyTransactionType.LEASE,
    } as any, owner)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.property.update).not.toHaveBeenCalled();
  });

  it('clears stale sale fields when changing SALE to LEASE', async () => {
    await service.update('p1', {
      transactionType: PropertyTransactionType.LEASE,
      leaseTermMonths: 24,
    } as any, owner);
    expect(prisma.property.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'p1' },
      data: expect.objectContaining({
        transactionType: PropertyTransactionType.LEASE,
        askingPrice: null,
        priceNegotiable: false,
        landArea: null,
        landAreaUnit: null,
        leaseTermMonths: 24,
      }),
    }));
  });

  it('clears category-specific fields when changing a marketplace listing back to RENT', async () => {
    await service.update('p1', {
      transactionType: PropertyTransactionType.RENT,
    } as any, owner).catch((error) => {
      // RENT transition is rejected if stale fields are validated; this test
      // intentionally asserts the desired invariant below through the update.
      throw error;
    });
    expect(prisma.property.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        transactionType: PropertyTransactionType.RENT,
        askingPrice: null,
        priceNegotiable: false,
        leaseTermMonths: null,
        leaseRenewalTerms: null,
        landArea: null,
        landAreaUnit: null,
      }),
    }));
  });
});
