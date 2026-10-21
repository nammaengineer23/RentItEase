import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PropertyDocumentReviewStatus } from '@prisma/client';
import { AdminModerationService } from './admin-moderation.service';

describe('AdminModerationService property document review', () => {
  const prisma = {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    review: { findUnique: jest.fn(), update: jest.fn() },
    propertyVisit: { findUnique: jest.fn(), update: jest.fn() },
  };
  const audit = { record: jest.fn() };
  let service: AdminModerationService;

  const context = {
    adminId: 'admin-1',
    ipAddress: '127.0.0.1',
    device: 'test-agent',
    reason: 'Documents checked',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminModerationService(prisma as any, audit as any);
  });

  it('rejects invalid review statuses before reading or writing the property', async () => {
    await expect(service.updatePropertyDocumentReview('p1', 'NOT_A_STATUS' as any, context))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.property.findUnique).not.toHaveBeenCalled();
    expect(prisma.property.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('requires a non-empty reason when rejecting documents', async () => {
    await expect(service.updatePropertyDocumentReview(
      'p1',
      PropertyDocumentReviewStatus.REJECTED,
      { ...context, reason: '   ' },
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.property.findUnique).not.toHaveBeenCalled();
    expect(prisma.property.update).not.toHaveBeenCalled();
  });

  it('returns not found and does not audit when the property does not exist', async () => {
    prisma.property.findUnique.mockResolvedValue(null);
    await expect(service.updatePropertyDocumentReview(
      'missing',
      PropertyDocumentReviewStatus.UNDER_REVIEW,
      context,
    )).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.property.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('records the previous and next review status and rejection reason in the audit log', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'p1',
      documentReviewStatus: PropertyDocumentReviewStatus.UNDER_REVIEW,
      isVerified: false,
      isAvailable: false,
    });
    prisma.property.update.mockResolvedValue({
      id: 'p1',
      title: 'Example property',
      transactionType: 'SALE',
      documentReviewStatus: PropertyDocumentReviewStatus.REJECTED,
      isVerified: false,
      isAvailable: false,
    });
    audit.record.mockResolvedValue({ id: 'audit-1' });

    const result = await service.updatePropertyDocumentReview(
      'p1',
      PropertyDocumentReviewStatus.REJECTED,
      { ...context, reason: 'Ownership document is unreadable' },
    );

    expect(result.documentReviewStatus).toBe(PropertyDocumentReviewStatus.REJECTED);
    expect(result.isVerified).toBe(false);
    expect(result.isAvailable).toBe(false);
    expect(prisma.property.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'p1' },
      data: { documentReviewStatus: PropertyDocumentReviewStatus.REJECTED },
    }));
    expect(audit.record).toHaveBeenCalledWith(
      { ...context, reason: 'Ownership document is unreadable' },
      'PROPERTY_DOCUMENT_REVIEW',
      'PROPERTY',
      'p1',
      { documentReviewStatus: PropertyDocumentReviewStatus.UNDER_REVIEW },
      { documentReviewStatus: PropertyDocumentReviewStatus.REJECTED },
    );
  });

  it('does not change verification or availability when marking documents verified', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'p2',
      documentReviewStatus: PropertyDocumentReviewStatus.SUBMITTED,
      isVerified: false,
      isAvailable: false,
    });
    prisma.property.update.mockResolvedValue({
      id: 'p2',
      title: 'Another property',
      transactionType: 'LEASE',
      documentReviewStatus: PropertyDocumentReviewStatus.VERIFIED,
      isVerified: false,
      isAvailable: false,
    });

    const result = await service.updatePropertyDocumentReview(
      'p2',
      PropertyDocumentReviewStatus.VERIFIED,
      context,
    );

    expect(result.documentReviewStatus).toBe(PropertyDocumentReviewStatus.VERIFIED);
    expect(result.isVerified).toBe(false);
    expect(result.isAvailable).toBe(false);
    expect(audit.record).toHaveBeenCalledWith(
      context,
      'PROPERTY_DOCUMENT_REVIEW',
      'PROPERTY',
      'p2',
      { documentReviewStatus: PropertyDocumentReviewStatus.SUBMITTED },
      { documentReviewStatus: PropertyDocumentReviewStatus.VERIFIED },
    );
  });
});
