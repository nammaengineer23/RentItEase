import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BookingStatus, VisitStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================
  // Create / Update Review
  // ==========================
  async create(
    propertyId: string,
    userId: string,
    dto: CreateReviewDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId === userId) {
      throw new BadRequestException(
        'You cannot review your own property.',
      );
    }

    const completedExperience = await this.prisma.propertyVisit.findFirst({
      where: {
        propertyId,
        tenantId: userId,
        OR: [
          { status: VisitStatus.COMPLETED },
          {
            booking: {
              status: BookingStatus.COMPLETED,
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!completedExperience) {
      throw new BadRequestException(
        'You can review a property only after a completed visit or rental.',
      );
    }

    const existing = await this.prisma.review.findFirst({
      where: {
        propertyId,
        userId,
      },
    });

    if (!existing) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentReviews = await this.prisma.review.count({
        where: {
          userId,
          createdAt: { gte: since },
        },
      });
      if (recentReviews >= 10) {
        throw new BadRequestException(
          'Daily review creation limit reached. Please try again later.',
        );
      }
    }

    if (existing) {
      const review = await this.prisma.review.update({
        where: {
          id: existing.id,
        },
        data: {
          rating: dto.rating,
          comment: dto.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Review updated successfully.',
        review,
      };
    }

    const review = await this.prisma.review.create({
      data: {
        propertyId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Review added successfully.',
      review,
    };
  }

  // ==========================
  // Get Reviews
  // ==========================
  async findByProperty(
    propertyId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const [reviews, total, aggregate] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { propertyId },
        include: {
          user: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { propertyId } }),
      this.prisma.review.aggregate({
        where: { propertyId },
        _avg: { rating: true },
      }),
    ]);

    return {
      success: true,
      total,
      averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      data: reviews,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================
  // Review Statistics
  // ==========================
  async getStats(propertyId: string) {
    const [aggregate, grouped] = await this.prisma.$transaction([
      this.prisma.review.aggregate({
        where: { propertyId },
        _count: { id: true },
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { propertyId },
        orderBy: { rating: 'desc' },
        _count: { rating: true },
      }),
    ]);

    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const group of grouped) {
      const count =
        typeof group._count === 'object' &&
        group._count !== null &&
        'rating' in group._count
          ? group._count.rating ?? 0
          : 0;
      const rating = group.rating as keyof typeof ratings;
      if (rating in ratings) {
        ratings[rating] = count;
      }
    }

    return {
      success: true,
      averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      totalReviews: aggregate._count.id,
      ratings,
    };
  }

  // ==========================
  // Update Review
  // ==========================
  async update(
    reviewId: string,
    userId: string,
    dto: UpdateReviewDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException(
        'You can update only your own review',
      );
    }

    const updatedReview =
      await this.prisma.review.update({
        where: {
          id: reviewId,
        },
        data: dto,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

    return {
      success: true,
      message: 'Review updated successfully.',
      review: updatedReview,
    };
  }

  // ==========================
  // Delete Review
  // ==========================
  async remove(
    reviewId: string,
    userId: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException(
        'You can delete only your own review',
      );
    }

    await this.prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    return {
      success: true,
      message: 'Review deleted successfully.',
    };
  }
}