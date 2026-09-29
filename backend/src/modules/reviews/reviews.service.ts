import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

    const review = await this.prisma.review.upsert({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      create: {
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
      message: 'Review saved successfully.',
      review,
    };
  }

  // ==========================
  // Get Reviews
  // ==========================
  async findByProperty(propertyId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        propertyId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const averageRating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce(
                (sum, review) => sum + review.rating,
                0,
              ) / reviews.length
            ).toFixed(1),
          )
        : 0;

    return {
      success: true,
      total: reviews.length,
      averageRating,
      data: reviews,
    };
  }

  // ==========================
  // Review Statistics
  // ==========================
  async getStats(propertyId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        propertyId,
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;

    const ratings = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (totalReviews === 0) {
      return {
        success: true,
        averageRating: 0,
        totalReviews: 0,
        ratings,
      };
    }

    let totalRating = 0;

    for (const review of reviews) {
      totalRating += review.rating;
      ratings[
        review.rating as keyof typeof ratings
      ]++;
    }

    return {
      success: true,
      averageRating: Number(
        (totalRating / totalReviews).toFixed(1),
      ),
      totalReviews,
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