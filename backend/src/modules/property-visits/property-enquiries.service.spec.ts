import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PropertyEnquiryStatus, PropertyTransactionType, UserRole } from '@prisma/client';
import { PropertyEnquiriesService } from './property-enquiries.service';

describe('PropertyEnquiriesService', () => {
  const prisma = {
    property: { findUnique: jest.fn() },
    propertyEnquiry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: PropertyEnquiriesService;
  const user = { id: 'buyer-1', role: UserRole.USER };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertyEnquiriesService(prisma as any);
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'true';
  });

  afterAll(() => {
    delete process.env.PROPERTY_MARKETPLACE_ENABLED;
  });

  it('rejects creating enquiries while the marketplace flag is disabled', async () => {
    process.env.PROPERTY_MARKETPLACE_ENABLED = 'false';
    await expect(service.create({ propertyId: 'p1', message: 'Interested in this property' }, user))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.property.findUnique).not.toHaveBeenCalled();
  });

  it('does not disclose missing, unverified, unavailable, or rental listings', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'p1', ownerId: 'owner-1', transactionType: PropertyTransactionType.RENT,
      isVerified: true, isAvailable: true,
    });
    await expect(service.create({ propertyId: 'p1', message: 'Interested in this property' }, user))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.propertyEnquiry.create).not.toHaveBeenCalled();
  });

  it('prevents owners from enquiring about their own listings', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'p1', ownerId: user.id, transactionType: PropertyTransactionType.SALE,
      isVerified: true, isAvailable: true,
    });
    await expect(service.create({ propertyId: 'p1', message: 'Interested in this property' }, user))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.propertyEnquiry.create).not.toHaveBeenCalled();
  });

  it('creates a separate enquiry for an eligible non-rental listing', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'p1', ownerId: 'owner-1', transactionType: PropertyTransactionType.SITE_SALE,
      isVerified: true, isAvailable: true,
    });
    prisma.propertyEnquiry.create.mockResolvedValue({
      id: 'e1', propertyId: 'p1', senderId: user.id, message: 'Interested in this property',
      status: PropertyEnquiryStatus.OPEN, createdAt: new Date('2026-10-10T00:00:00Z'),
    });
    const result = await service.create({ propertyId: 'p1', message: '  Interested in this property  ' }, user);
    expect(prisma.propertyEnquiry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { propertyId: 'p1', senderId: user.id, message: 'Interested in this property' },
    }));
    expect(result.success).toBe(true);
  });

  it('prevents unrelated users from changing enquiry status (IDOR)', async () => {
    prisma.propertyEnquiry.findUnique.mockResolvedValue({
      id: 'e1', status: PropertyEnquiryStatus.OPEN, property: { ownerId: 'real-owner' },
    });
    await expect(service.updateStatus('e1', { status: PropertyEnquiryStatus.CONTACTED }, user))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.propertyEnquiry.update).not.toHaveBeenCalled();
  });

  it('allows the listing owner to update enquiry status', async () => {
    prisma.propertyEnquiry.findUnique.mockResolvedValue({
      id: 'e1', status: PropertyEnquiryStatus.OPEN, property: { ownerId: 'owner-1' },
    });
    prisma.propertyEnquiry.update.mockResolvedValue({
      id: 'e1', propertyId: 'p1', senderId: 'buyer-1', message: 'Interested',
      status: PropertyEnquiryStatus.CONTACTED, updatedAt: new Date('2026-10-10T00:00:00Z'),
    });
    const result = await service.updateStatus('e1', { status: PropertyEnquiryStatus.CONTACTED }, {
      id: 'owner-1', role: UserRole.OWNER,
    });
    expect(result.success).toBe(true);
    expect(prisma.propertyEnquiry.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: PropertyEnquiryStatus.CONTACTED },
    }));
  });

  it('allows administrators to update enquiry status', async () => {
    prisma.propertyEnquiry.findUnique.mockResolvedValue({
      id: 'e1', status: PropertyEnquiryStatus.OPEN, property: { ownerId: 'owner-1' },
    });
    prisma.propertyEnquiry.update.mockResolvedValue({
      id: 'e1', propertyId: 'p1', senderId: 'buyer-1', message: 'Interested',
      status: PropertyEnquiryStatus.CLOSED, updatedAt: new Date('2026-10-10T00:00:00Z'),
    });
    const result = await service.updateStatus('e1', { status: PropertyEnquiryStatus.CLOSED }, {
      id: 'admin-1', role: UserRole.ADMIN,
    });
    expect(result.success).toBe(true);
  });

  it('returns not found for status updates against missing enquiry IDs', async () => {
    prisma.propertyEnquiry.findUnique.mockResolvedValue(null);
    await expect(service.updateStatus('missing', { status: PropertyEnquiryStatus.CLOSED }, user))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
