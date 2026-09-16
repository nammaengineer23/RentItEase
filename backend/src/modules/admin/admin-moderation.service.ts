import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { VisitStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

@Injectable()
export class AdminModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async updateReview(id: string, input: { rating?: number; comment?: string | null }) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found.');
    if (input.rating !== undefined && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) throw new BadRequestException('Rating must be an integer between 1 and 5.');
    if (input.comment !== undefined && input.comment !== null && input.comment.length > 2000) throw new BadRequestException('Review comment must not exceed 2000 characters.');
    if (input.rating === undefined && input.comment === undefined) throw new BadRequestException('Provide rating or comment to update.');
    return serializePrisma(await this.prisma.review.update({ where: { id }, data: { ...(input.rating !== undefined ? { rating: input.rating } : {}), ...(input.comment !== undefined ? { comment: input.comment?.trim() || null } : {}) }, include: { user: { select: { id: true, fullName: true, email: true } }, property: { select: { id: true, title: true, city: true, locality: true } } } }));
  }

  async listVisits() {
    return serializePrisma(await this.prisma.propertyVisit.findMany({
      include: {
        tenant: { select: { id: true, fullName: true, email: true, phone: true } },
        property: { select: { id: true, title: true, city: true, locality: true, owner: { select: { id: true, fullName: true, email: true, phone: true } } } },
        booking: { select: { id: true, status: true, bookingDate: true, approvedAt: true, cancelledAt: true, completedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }));
  }

  async transitionVisit(id: string, action: 'approve' | 'reject' | 'complete' | 'cancel') {
    const visit = await this.prisma.propertyVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Visit not found.');
    const allowed: Record<typeof action, VisitStatus[]> = {
      approve: [VisitStatus.PENDING], reject: [VisitStatus.PENDING], complete: [VisitStatus.APPROVED], cancel: [VisitStatus.PENDING, VisitStatus.APPROVED],
    };
    if (!allowed[action].includes(visit.status)) throw new BadRequestException(`Visit cannot be ${action}d from ${visit.status.toLowerCase()} status.`);
    const status: VisitStatus = action === 'approve' ? VisitStatus.APPROVED : action === 'reject' ? VisitStatus.REJECTED : action === 'complete' ? VisitStatus.COMPLETED : VisitStatus.CANCELLED;
    return serializePrisma(await this.prisma.propertyVisit.update({ where: { id }, data: { status }, include: { tenant: { select: { id: true, fullName: true, email: true, phone: true } }, property: { select: { id: true, title: true, city: true, locality: true, owner: { select: { id: true, fullName: true, email: true } } } }, booking: { select: { id: true, status: true } } } }));
  }

  cancelVisit(id: string) { return this.transitionVisit(id, 'cancel'); }
}
