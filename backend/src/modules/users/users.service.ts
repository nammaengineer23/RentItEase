import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OwnerRequestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async requestOwnerRole(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role !== UserRole.USER) {
      throw new BadRequestException('Only tenant accounts can request owner access.');
    }
    if (user.ownerRequestStatus === OwnerRequestStatus.PENDING) {
      throw new BadRequestException('Owner request is already pending.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ownerRequestStatus: OwnerRequestStatus.PENDING,
        ownerRequestedAt: new Date(),
        ownerReviewedAt: null,
      },
      select: { id: true, role: true, ownerRequestStatus: true, ownerRequestedAt: true },
    });
  }

  getOwnerRequests() {
    return this.prisma.user.findMany({
      where: { ownerRequestStatus: OwnerRequestStatus.PENDING },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        ownerRequestStatus: true,
        ownerRequestedAt: true,
      },
      orderBy: { ownerRequestedAt: 'asc' },
    });
  }

  async reviewOwnerRequest(userId: string, approve: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.ownerRequestStatus !== OwnerRequestStatus.PENDING) {
      throw new BadRequestException('No pending owner request found.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: approve ? UserRole.OWNER : user.role,
        ownerRequestStatus: approve
            ? OwnerRequestStatus.APPROVED
            : OwnerRequestStatus.REJECTED,
        ownerReviewedAt: new Date(),
      },
      select: { id: true, role: true, ownerRequestStatus: true, ownerReviewedAt: true },
    });
  }
}
