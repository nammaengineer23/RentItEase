import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus, Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import Razorpay from 'razorpay';

import { PrismaService } from '../../database/prisma.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';

@Injectable()
export class MembershipService {
  private readonly razorpay?: Razorpay;

  constructor(private readonly prisma: PrismaService) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  private async ensurePremiumPlan() {
    return this.prisma.membershipPlan.upsert({
      where: { code: 'PREMIUM' },
      update: {
        name: 'Premium 30 Days',
        description: 'Premium RentItEase access for 30 days',
        price: new Prisma.Decimal(99),
        durationDays: 30,
        isActive: true,
      },
      create: {
        name: 'Premium 30 Days',
        code: 'PREMIUM',
        description: 'Premium RentItEase access for 30 days',
        price: new Prisma.Decimal(99),
        durationDays: 30,
        isActive: true,
      },
    });
  }

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
    await this.ensurePremiumPlan();
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
    const now = new Date();

    await this.prisma.membership.updateMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        endDate: { lte: now },
      },
      data: { status: MembershipStatus.EXPIRED },
    });

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        OR: [{ endDate: null }, { endDate: { gt: now } }],
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

    if (membership.razorpayOrderId && !membership.paidAt) {
      throw new BadRequestException(
        'Premium membership payment has not been verified',
      );
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

  async requestPremiumMembership(userId: string) {
    const now = new Date();
    await this.prisma.membership.updateMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        endDate: { lte: now },
      },
      data: { status: MembershipStatus.EXPIRED, expiredAt: now },
    });

    const [user, plan, activeMembership, previousTrial] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, phone: true },
      }),
      this.ensurePremiumPlan(),
      this.prisma.membership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
        include: { plan: true },
      }),
      this.prisma.membership.findFirst({
        where: { userId, isTrial: true },
        select: { id: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (activeMembership) {
      return { membership: activeMembership, requiresPayment: false };
    }

    const pending = await this.prisma.membership.findFirst({
      where: {
        userId,
        planId: plan.id,
        status: MembershipStatus.PENDING,
        razorpayOrderId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (pending) {
      return {
        membership: pending,
        requiresPayment: true,
        checkout: {
          keyId: process.env.RAZORPAY_KEY_ID,
          razorpayOrderId: pending.razorpayOrderId,
          amount: Number(pending.amount),
          amountInPaise: Math.round(Number(pending.amount) * 100),
          currency: 'INR',
          customer: user,
        },
      };
    }

    if (!previousTrial) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      const membership = await this.prisma.$transaction(async (tx) => {
        const created = await tx.membership.create({
          data: {
            userId,
            planId: plan.id,
            status: MembershipStatus.ACTIVE,
            startDate,
            endDate,
            activatedAt: startDate,
            isTrial: true,
            amount: new Prisma.Decimal(0),
            notes: 'One-time 30-day premium trial',
          },
          include: { plan: true },
        });
        await tx.invoice.create({
          data: {
            invoiceNumber: `RIE-PREM-${created.id}`,
            userId,
            membershipId: created.id,
            amount: new Prisma.Decimal(0),
            taxAmount: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(0),
            currency: 'INR',
            status: 'PAID',
            description: 'Complimentary 30-day RentItEase Premium trial',
          },
        });
        return created;
      });

      return { membership, requiresPayment: false, trialGranted: true };
    }

    if (!this.razorpay || !process.env.RAZORPAY_KEY_ID) {
      throw new BadRequestException('Premium payment is not configured');
    }

    const amount = 99;
    const order = await this.razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `premium_${userId}_${Date.now()}`.slice(0, 40),
      notes: { userId, planId: plan.id, purpose: 'PREMIUM_MEMBERSHIP' },
    });
    const membership = await this.prisma.membership.create({
      data: {
        userId,
        planId: plan.id,
        status: MembershipStatus.PENDING,
        amount: new Prisma.Decimal(amount),
        razorpayOrderId: order.id,
        notes: 'Premium membership purchase',
      },
      include: { plan: true },
    });

    return {
      membership,
      requiresPayment: true,
      checkout: {
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: order.id,
        amount,
        amountInPaise: amount * 100,
        currency: 'INR',
        customer: user,
      },
    };
  }

  async verifyPremiumPayment(
    userId: string,
    body: {
      membershipId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    const paymentFields = [
      body.membershipId,
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
    ];
    if (
      paymentFields.some(
        (value) => typeof value !== 'string' || value.trim().length === 0,
      )
    ) {
      throw new BadRequestException('Complete payment details are required');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { id: body.membershipId, userId },
      include: { plan: true },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.status === MembershipStatus.ACTIVE) return membership;
    if (membership.status !== MembershipStatus.PENDING) {
      throw new BadRequestException('Membership is not awaiting payment');
    }
    if (membership.razorpayOrderId !== body.razorpayOrderId) {
      throw new BadRequestException('Razorpay order ID does not match');
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new BadRequestException('Premium payment is not configured');
    const signature = createHmac('sha256', secret)
      .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
      .digest('hex');
    if (signature !== body.razorpaySignature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.membership.update({
        where: { id: membership.id },
        data: {
          status: MembershipStatus.ACTIVE,
          startDate,
          endDate,
          activatedAt: startDate,
          paidAt: startDate,
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.razorpaySignature,
        },
        include: { plan: true },
      });
      await tx.invoice.upsert({
        where: { invoiceNumber: `RIE-PREM-${membership.id}` },
        update: { status: 'PAID', membershipId: membership.id },
        create: {
          invoiceNumber: `RIE-PREM-${membership.id}`,
          userId,
          membershipId: membership.id,
          amount: membership.amount,
          taxAmount: new Prisma.Decimal(0),
          totalAmount: membership.amount,
          currency: 'INR',
          status: 'PAID',
          description: 'RentItEase Premium membership - 30 days',
        },
      });
      return updated;
    });
  }
}
