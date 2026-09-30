import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  LeaseStatus,
  Prisma,
  ReviewStatus,
  UserRole,
  VisitStatus,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const MAX_COMMENT_LENGTH = 1000;
const EDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_REVIEWS_PER_DAY = 10;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(propertyId: string, userId: string, dto: CreateReviewDto) {
    const rating = dto.rating;
    const comment = this.normalizeComment(dto.comment);

    this.validateContent(rating, comment);

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const property = await tx.property.findUnique({
          where: { id: propertyId },
          select: { id: true, ownerId: true },
        });

        if (!property) {
          throw new NotFoundException('Property not found');
        }

        if (property.ownerId === userId) {
          throw new BadRequestException('You cannot review your own property.');
        }

        const existing = await tx.review.findUnique({
          where: { userId_propertyId: { userId, propertyId } },
          select: { id: true },
        });

        if (existing) {
          throw new BadRequestException('You have already reviewed this property.');
        }

        const eligibility = await this.getEligibility(tx, propertyId, userId);
        if (!eligibility) {
          throw new BadRequestException(
            'A review requires a completed property visit or completed rental.',
          );
        }

        await this.ensureNotSpam(tx, userId, comment);

        return tx.review.create({
          data: {
            propertyId,
            userId,
            rating,
            comment,
            status: ReviewStatus.PENDING,
          },
          include: {
            user: { select: { id: true, fullName: true } },
          },
        });
      }, { isolationLevel: 'Serializable' });

      return {
        success: true,
        message: 'Review submitted for moderation.',
        review,
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('You have already reviewed this property.');
      }
      if (error?.code === 'P2034') {
        throw new BadRequestException('Review submission conflicted with another request. Please retry.');
      }
      throw error;
    }
  }

  async findByProperty(propertyId: string, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(50, Math.max(1, Math.floor(limit)))
      : 20;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { propertyId, status: ReviewStatus.APPROVED },
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.review.count({
        where: { propertyId, status: ReviewStatus.APPROVED },
      }),
    ]);

    const stats = await this.aggregateApproved(propertyId);

    return {
      success: true,
      total,
      averageRating: stats.averageRating,
      data: reviews,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getStats(propertyId: string) {
    const stats = await this.aggregateApproved(propertyId);
    return { success: true, ...stats };
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        propertyId: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can update only your own review');
    }

    if (Date.now() - review.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new BadRequestException('Reviews can only be edited within 30 days.');
    }

    const rating = dto.rating ?? review.rating;
    const comment = dto.comment === undefined
      ? review.comment
      : this.normalizeComment(dto.comment);

    this.validateContent(rating, comment);

    const eligibility = await this.getEligibility(this.prisma, review.propertyId, userId);
    if (!eligibility) {
      throw new BadRequestException(
        'A review requires a completed property visit or completed rental.',
      );
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment,
        status: ReviewStatus.PENDING,
      },
      include: { user: { select: { id: true, fullName: true } } },
    });

    return {
      success: true,
      message: 'Review updated and sent for moderation.',
      review: updatedReview,
    };
  }

  async remove(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can delete only your own review');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });

    return { success: true, message: 'Review deleted successfully.' };
  }

  async getModerationQueue() {
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.PENDING },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        property: { select: { id: true, title: true, city: true, locality: true, ownerId: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async moderate(reviewId: string, status: ReviewStatus, adminRole: UserRole) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can moderate reviews.');
    }

    if (status !== ReviewStatus.APPROVED && status !== ReviewStatus.REJECTED) {
      throw new BadRequestException('Invalid moderation status.');
    }

    const updated = await this.prisma.review.updateMany({
      where: { id: reviewId, status: ReviewStatus.PENDING },
      data: { status },
    });

    if (updated.count !== 1) {
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { id: true },
      });
      if (!review) {
        throw new NotFoundException('Review not found');
      }
      throw new BadRequestException('Review is no longer pending moderation.');
    }

    return {
      success: true,
      message: `Review ${status.toLowerCase()} successfully.`,
      status,
    };
  }

  private async getEligibility(tx: Prisma.TransactionClient | PrismaService, propertyId: string, userId: string) {
    const [completedVisit, completedBooking, completedLease] = await Promise.all([
      tx.propertyVisit.findFirst({
        where: { propertyId, tenantId: userId, status: VisitStatus.COMPLETED },
        select: { id: true },
      }),
      tx.booking.findFirst({
        where: { propertyId, tenantId: userId, status: BookingStatus.COMPLETED },
        select: { id: true },
      }),
      tx.lease.findFirst({
        where: { propertyId, tenantId: userId, status: LeaseStatus.COMPLETED },
        select: { id: true },
      }),
    ]);

    return Boolean(completedVisit || completedBooking || completedLease);
  }

  private async ensureNotSpam(
    tx: Prisma.TransactionClient | PrismaService,
    userId: string,
    comment: string | null,
  ) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await tx.review.count({
      where: { userId, createdAt: { gte: since } },
    });

    if (recentCount >= MAX_REVIEWS_PER_DAY) {
      throw new BadRequestException('Review submission limit reached. Please try again later.');
    }

    if (!comment) {
      return;
    }

    const recentComments = await tx.review.findMany({
      where: { userId, createdAt: { gte: since }, comment: { not: null } },
      select: { comment: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const normalized = comment.toLowerCase();
    if (recentComments.some((item) => item.comment?.trim().toLowerCase() === normalized)) {
      throw new BadRequestException('Repeated review content is not allowed.');
    }
  }

  private normalizeComment(comment?: string | null) {
    if (comment === undefined || comment === null) {
      return null;
    }

    const normalized = comment.trim().replace(/\s+/g, ' ');
    return normalized || null;
  }

  private validateContent(rating: number, comment: string | null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be an integer from 1 to 5.');
    }

    if (comment && comment.length > MAX_COMMENT_LENGTH) {
      throw new BadRequestException(`Comment must be at most ${MAX_COMMENT_LENGTH} characters.`);
    }

    if (comment && /(https?:\/\/|www\.)/i.test(comment)) {
      throw new BadRequestException('Reviews cannot contain external links.');
    }
  }

  private async aggregateApproved(propertyId: string) {
    const [aggregate, grouped] = await Promise.all([
      this.prisma.review.aggregate({
        where: { propertyId, status: ReviewStatus.APPROVED },
        _count: { _all: true },
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { propertyId, status: ReviewStatus.APPROVED },
        _count: { _all: true },
      }),
    ]);

    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const row of grouped) {
      ratings[row.rating as keyof typeof ratings] = row._count._all;
    }

    return {
      averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      totalReviews: aggregate._count._all,
      ratings,
    };
  }
}
