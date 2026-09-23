import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateAppFeedbackDto } from './dto/create-app-feedback.dto';

@Injectable()
export class AppFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async publicSummary() {
    const [aggregate, reviews, visitorCount, downloadCount] = await Promise.all([
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
      this.prisma.appDownload.count(),
    ]);

    return {
      visitorCount,
      downloadCount,
      averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      ratingCount: aggregate._count.rating,
      reviews: reviews.map((review) => ({
        rating: review.rating,
        comment: review.comment,
        reviewer: this.publicReviewerName(review.user.fullName),
        createdAt: review.createdAt,
      })),
    };
  }

  async recordDownload(source?: string) {
    await this.prisma.appDownload.create({
      data: { source: source?.trim() || null },
    });
    const downloadCount = await this.prisma.appDownload.count();
    return { downloadCount };
  }

  async recordVisit(visitorId?: string) {
    const normalized = visitorId?.trim().slice(0, 128);
    if (normalized) {
      await this.prisma.landingVisit.upsert({
        where: { visitorId: normalized },
        create: { visitorId: normalized },
        update: { lastSeenAt: new Date() },
      });
    } else {
      await this.prisma.landingVisit.create({ data: {} });
    }
    const visitorCount = await this.prisma.landingVisit.count();
    return { visitorCount };
  }

  private publicReviewerName(fullName: string) {
    const firstName = fullName.trim().split(/\s+/)[0];
    return firstName || 'RentItEase user';
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
