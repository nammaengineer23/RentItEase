import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReviewStatus, UserRole } from '@prisma/client';

import { ReviewsService } from './reviews.service';

describe('ReviewsService hardening', () => {
  let service: ReviewsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
      property: { findUnique: jest.fn() },
      review: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      propertyVisit: { findFirst: jest.fn() },
      booking: { findFirst: jest.fn() },
      lease: { findFirst: jest.fn() },
    };

    service = new ReviewsService(prisma);
  });

  it('rejects owners from reviewing their own property', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'u1' });

    await expect(
      service.create('p1', 'u1', { rating: 5, comment: 'Good' }),
    ).rejects.toThrow('You cannot review your own property.');
  });

  it('requires a completed visit or rental before creating a review', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner' });
    prisma.review.findUnique.mockResolvedValue(null);
    prisma.propertyVisit.findFirst.mockResolvedValue(null);
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.lease.findFirst.mockResolvedValue(null);

    await expect(
      service.create('p1', 'u1', { rating: 5, comment: 'Good' }),
    ).rejects.toThrow('completed property visit or completed rental');
  });

  it('blocks duplicate review creation atomically', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner' });
    prisma.review.findUnique.mockResolvedValue({ id: 'r1' });

    await expect(
      service.create('p1', 'u1', { rating: 5 }),
    ).rejects.toThrow('already reviewed');
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('validates rating and rejects external links', async () => {
    await expect(
      service.create('p1', 'u1', { rating: 6 }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create('p1', 'u1', { rating: 5, comment: 'https://spam.example' }),
    ).rejects.toThrow('external links');
  });

  it('prevents non-owners from editing reviews', async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'owner-user',
      propertyId: 'p1',
      rating: 5,
      comment: 'Good',
      status: ReviewStatus.APPROVED,
      createdAt: new Date(),
    });

    await expect(
      service.update('r1', 'other-user', { rating: 4 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('moves an edited approved review back to moderation', async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      propertyId: 'p1',
      rating: 5,
      comment: 'Good',
      status: ReviewStatus.APPROVED,
      createdAt: new Date(),
    });
    prisma.propertyVisit.findFirst.mockResolvedValue({ id: 'v1' });
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.lease.findFirst.mockResolvedValue(null);
    prisma.review.update.mockResolvedValue({ id: 'r1', status: ReviewStatus.PENDING });

    await service.update('r1', 'u1', { rating: 4 });

    expect(prisma.review.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ rating: 4, status: ReviewStatus.PENDING }),
    }));
  });

  it('aggregates only approved reviews', async () => {
    prisma.review.aggregate.mockResolvedValue({
      _count: { _all: 2 },
      _avg: { rating: 4.5 },
    });
    prisma.review.groupBy.mockResolvedValue([
      { rating: 5, _count: { _all: 1 } },
      { rating: 4, _count: { _all: 1 } },
    ]);

    const result = await service.getStats('p1');

    expect(result).toEqual(expect.objectContaining({
      averageRating: 4.5,
      totalReviews: 2,
      ratings: expect.objectContaining({ 5: 1, 4: 1 }),
    }));
    expect(prisma.review.aggregate).toHaveBeenCalledWith({
      where: { propertyId: 'p1', status: ReviewStatus.APPROVED },
      _count: { _all: true },
      _avg: { rating: true },
    });
  });

  it('allows only administrators to moderate', async () => {
    await expect(
      service.moderate('r1', ReviewStatus.APPROVED, UserRole.USER),
    ).rejects.toThrow(ForbiddenException);
  });
});
