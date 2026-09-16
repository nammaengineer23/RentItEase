import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

@Injectable()
export class AdminModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async updateReview(id: string, input: { rating?: number; comment?: string | null }) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found.');

    if (input.rating !== undefined && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
      throw new BadRequestException('Rating must be an integer between 1 and 5.');
    }

    if (input.comment !== undefined && input.comment !== null && input.comment.length > 2000) {
      throw new BadRequestException('Review comment must not exceed 2000 characters.');
    }

    if (input.rating === undefined && input.comment === undefined) {
      throw new BadRequestException('Provide rating or comment to update.');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.comment !== undefined ? { comment: input.comment?.trim() || null } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        property: { select: { id: true, title: true, city: true, locality: true } },
      },
    });

    return serializePrisma(updated);
  }

  async cancelVisit(id: string) {
    const visit = await this.prisma.propertyVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Visit not found.');
    if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
      throw new BadRequestException(`A ${visit.status.toLowerCase()} visit cannot be cancelled.`);
    }

    return serializePrisma(
      await this.prisma.propertyVisit.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
    );
  }
}
