import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateAppFeedbackDto } from './dto/create-app-feedback.dto';

@Injectable()
export class AppFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async publicSummary() {
    const [aggregate, reviews, visitorCount] = await Promise.all([
      this.prisma.appFeedback.aggregate({
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.appFeedback.findMany({
        where: { comment: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { fullName: true } },
        },
      }),
      this.prisma.landingVisit.count(),
    ]);

    return {
      visitorCount,
      averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      ratingCount: aggregate._count.rating,
      reviews: reviews.map((review) => ({
        rating: review.rating,
        comment: review.comment,
        reviewer: review.user.fullName,
        createdAt: review.createdAt,
      })),
    };
  }

  async recordVisit() {
    await this.prisma.landingVisit.create({ data: {} });
    const visitorCount = await this.prisma.landingVisit.count();
    return { visitorCount };
  }

  create(userId: string, dto: CreateAppFeedbackDto) {
    return this.prisma.appFeedback.create({
      data: {
        userId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        platform: dto.platform,
        appVersion: dto.appVersion,
      },
    });
  }
}
