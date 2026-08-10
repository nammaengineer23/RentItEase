import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // MEMBERSHIP PLANS
  // ============================================================

  async createPlan(dto: CreateMembershipPlanDto) {
    const existing = await this.prisma.membershipPlan.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        'A membership plan with this code already exists',
      );
    }

    return this.prisma.membershipPlan.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        durationDays: dto.durationDays,
        isActive: true,
      },
    });
  }

  async getPlans(includeInactive = false) {
    return this.prisma.membershipPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ price: 'asc' }, { durationDays: 'asc' }],
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    return plan;
  }

  async updatePlan(id: string, dto: UpdateMembershipPlanDto) {
    await this.getPlan(id);

    if (dto.code) {
      const existing = await this.prisma.membershipPlan.findFirst({
        where: {
          code: dto.code,
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          'A membership plan with this code already exists',
        );
      }
    }

    return this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.price !== undefined && {
          price: new Prisma.Decimal(dto.price),
        }),
        ...(dto.durationDays !== undefined && {
          durationDays: dto.durationDays,
        }),
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
        }),
      },
    });
  }

  async deactivatePlan(id: string) {
    await this.getPlan(id);

    return this.prisma.membershipPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================================
  // MEMBERSHIPS
  // ============================================================

  async createMembership(
    userId: string,
    planId: string,
    autoRenew = false,
    notes?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Membership plan is inactive');
    }

    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (activeMembership) {
      throw new BadRequestException('User already has an active membership');
    }

    return this.prisma.membership.create({
      data: {
        userId,
        planId,
        status: MembershipStatus.PENDING,
        autoRenew,
        notes,
      },
      include: {
        plan: true,
      },
    });
  }

  async getUserMemberships(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMembership(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  async getActiveMembership(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    return membership;
  }

  // ============================================================
  // ACTIVATION
  // ============================================================

  async activateMembership(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.status === MembershipStatus.ACTIVE) {
      throw new BadRequestException('Membership is already active');
    }

    if (membership.status === MembershipStatus.CANCELLED) {
      throw new BadRequestException('Cancelled membership cannot be activated');
    }

    const existingActive = await this.prisma.membership.findFirst({
      where: {
        userId: membership.userId,
        status: MembershipStatus.ACTIVE,
        NOT: { id },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'User already has another active membership',
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    endDate.setDate(endDate.getDate() + membership.plan.durationDays);

    return this.prisma.membership.update({
      where: { id },
      data: {
        status: MembershipStatus.ACTIVE,
        startDate,
        endDate,
        activatedAt: startDate,
        expiredAt: null,
        cancelledAt: null,
      },
      include: {
        plan: true,
      },
    });
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async cancelMembership(id: string) {
    const membership = await this.getMembership(id);

    if (membership.status === MembershipStatus.CANCELLED) {
      throw new BadRequestException('Membership is already cancelled');
    }

    if (membership.status === MembershipStatus.EXPIRED) {
      throw new BadRequestException('Expired membership cannot be cancelled');
    }

    return this.prisma.membership.update({
      where: { id },
      data: {
        status: MembershipStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        plan: true,
      },
    });
  }

  // ============================================================
  // EXPIRY
  // ============================================================

  async expireMembership(id: string) {
    const membership = await this.getMembership(id);

    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Only active memberships can be expired');
    }

    return this.prisma.membership.update({
      where: { id },
      data: {
        status: MembershipStatus.EXPIRED,
        expiredAt: new Date(),
      },
      include: {
        plan: true,
      },
    });
  }

  async expireDueMemberships() {
    const now = new Date();

    const result = await this.prisma.membership.updateMany({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: {
          lte: now,
        },
      },
      data: {
        status: MembershipStatus.EXPIRED,
        expiredAt: now,
      },
    });

    return {
      expiredCount: result.count,
      processedAt: now,
    };
  }

  // ============================================================
  // RENEWAL
  // ============================================================

  async renewMembership(id: string) {
    const membership = await this.getMembership(id);

    if (
      membership.status !== MembershipStatus.EXPIRED &&
      membership.status !== MembershipStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Only active or expired memberships can be renewed',
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    endDate.setDate(endDate.getDate() + membership.plan.durationDays);

    return this.prisma.membership.update({
      where: { id },
      data: {
        status: MembershipStatus.ACTIVE,
        startDate,
        endDate,
        activatedAt: membership.activatedAt ?? startDate,
        expiredAt: null,
        cancelledAt: null,
      },
      include: {
        plan: true,
      },
    });
  }

  // ============================================================
  // AUTO RENEW
  // ============================================================

  async updateAutoRenew(id: string, autoRenew: boolean) {
    await this.getMembership(id);

    return this.prisma.membership.update({
      where: { id },
      data: { autoRenew },
      include: {
        plan: true,
      },
    });
  }
}
