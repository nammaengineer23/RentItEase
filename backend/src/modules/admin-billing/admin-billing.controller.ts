import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../database/prisma.service";
import { serializePrisma } from "../../common/utils/prisma-response.util";
import { MembershipPlanCode } from "@prisma/client";
@ApiTags('Admin Billing')
@ApiBearerAuth()
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBillingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async overview() {
    const [
      plans,
      activePlans,
      memberships,
      activeMemberships,
      premiumListings,
      activePremiumListings,
      payments,
      successfulPayments,
      invoices,
      paidInvoices,
      successfulPaymentRows,
    ] = await Promise.all([
      this.prisma.membershipPlan.count(),
      this.prisma.membershipPlan.count({ where: { isActive: true } }),
      this.prisma.membership.count(),
      this.prisma.membership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.premiumListing.count(),
      this.prisma.premiumListing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'SUCCESS' } }),
      this.prisma.invoice.count(),
      this.prisma.invoice.count({ where: { status: 'PAID' } }),
      this.prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        select: { amount: true },
      }),
    ]);

    const revenue = successfulPaymentRows.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    return serializePrisma({
      plans,
      activePlans,
      memberships,
      activeMemberships,
      premiumListings,
      activePremiumListings,
      payments,
      successfulPayments,
      invoices,
      paidInvoices,
      revenue,
    });
  }

  @Get('plans')
  async getPlans() {
    return serializePrisma(
      await this.prisma.membershipPlan.findMany({
        orderBy: [{ price: 'asc' }, { durationDays: 'asc' }],
      }),
    );
  }

  @Post('plans')
  async createPlan(
    @Body()
    body: {
      name: string;
      code: MembershipPlanCode;
      description?: string;
      price: number;
      durationDays: number;
    },
  ) {
    if (
      !body.name?.trim() ||
      !Number.isFinite(Number(body.price)) ||
      !Number.isInteger(Number(body.durationDays))
    ) {
      throw new BadRequestException('Invalid membership plan.');
    }

    return serializePrisma(
      await this.prisma.membershipPlan.create({
        data: {
          name: body.name.trim(),
          code: body.code,
          description: body.description?.trim() || undefined,
          price: new Prisma.Decimal(body.price),
          durationDays: Number(body.durationDays),
          isActive: true,
        },
      }),
    );
  }

  @Patch('plans/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return serializePrisma(
      await this.prisma.membershipPlan.update({
        where: { id },
        data: {
          ...(typeof body.name === 'string' ? { name: body.name } : {}),
          ...(typeof body.description === 'string'
            ? { description: body.description }
            : {}),
          ...(body.price !== undefined
            ? { price: new Prisma.Decimal(Number(body.price)) }
            : {}),
          ...(body.durationDays !== undefined
            ? { durationDays: Number(body.durationDays) }
            : {}),
          ...(typeof body.isActive === 'boolean'
            ? { isActive: body.isActive }
            : {}),
        },
      }),
    );
  }

  @Patch('plans/:id/deactivate')
  async deactivatePlan(@Param('id') id: string) {
    return serializePrisma(
      await this.prisma.membershipPlan.update({
        where: { id },
        data: { isActive: false },
      }),
    );
  }

  @Get('memberships')
  async getMemberships() {
    return serializePrisma(
      await this.prisma.membership.findMany({
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  @Patch('memberships/:id/activate')
  async activateMembership(@Param('id') id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!membership) throw new BadRequestException('Membership not found.');
    if (membership.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cancelled membership cannot be activated.',
      );
    }
    const existing = await this.prisma.membership.findFirst({
      where: {
        userId: membership.userId,
        status: 'ACTIVE',
        NOT: { id },
      },
    });
    if (existing)
      throw new BadRequestException('User already has an active membership.');

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + membership.plan.durationDays);

    return serializePrisma(
      await this.prisma.membership.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          startDate,
          endDate,
          activatedAt: startDate,
          expiredAt: null,
          cancelledAt: null,
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          plan: true,
        },
      }),
    );
  }

  @Patch('memberships/:id/cancel')
  async cancelMembership(@Param('id') id: string) {
    return serializePrisma(
      await this.prisma.membership.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          plan: true,
        },
      }),
    );
  }

  @Patch('memberships/:id/expire')
  async expireMembership(@Param('id') id: string) {
    return serializePrisma(
      await this.prisma.membership.update({
        where: { id },
        data: { status: 'EXPIRED', expiredAt: new Date() },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          plan: true,
        },
      }),
    );
  }

  @Patch('memberships/:id/renew')
  async renewMembership(@Param('id') id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!membership) throw new BadRequestException('Membership not found.');
    if (membership.status !== 'ACTIVE' && membership.status !== 'EXPIRED') {
      throw new BadRequestException(
        'Only active or expired memberships can be renewed.',
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + membership.plan.durationDays);

    return serializePrisma(
      await this.prisma.membership.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          startDate,
          endDate,
          activatedAt: membership.activatedAt ?? startDate,
          expiredAt: null,
          cancelledAt: null,
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          plan: true,
        },
      }),
    );
  }

  @Get('premium-listings')
  async getPremiumListings() {
    return serializePrisma(
      await this.prisma.premiumListing.findMany({
        include: {
          property: {
            select: { id: true, title: true, city: true, locality: true },
          },
          user: { select: { id: true, fullName: true, email: true } },
          membership: { include: { plan: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  @Patch('premium-listings/:id/activate')
  async activatePremiumListing(@Param('id') id: string) {
    const listing = await this.prisma.premiumListing.findUnique({
      where: { id },
      include: { membership: true },
    });
    if (!listing) throw new BadRequestException('Premium listing not found.');
    if (listing.status === 'CANCELLED')
      throw new BadRequestException('Cancelled listing cannot be activated.');
    if (!listing.membership || listing.membership.status !== 'ACTIVE') {
      throw new BadRequestException('An active membership is required.');
    }

    const existing = await this.prisma.premiumListing.findFirst({
      where: { propertyId: listing.propertyId, status: 'ACTIVE', NOT: { id } },
    });
    if (existing)
      throw new BadRequestException(
        'Property already has an active premium listing.',
      );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + listing.durationDays);

    return serializePrisma(
      await this.prisma.premiumListing.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          startDate,
          endDate,
          activatedAt: startDate,
          expiredAt: null,
          cancelledAt: null,
        },
        include: {
          property: {
            select: { id: true, title: true, city: true, locality: true },
          },
          user: { select: { id: true, fullName: true, email: true } },
          membership: { include: { plan: true } },
        },
      }),
    );
  }

  @Patch('premium-listings/:id/cancel')
  async cancelPremiumListing(@Param('id') id: string) {
    return serializePrisma(
      await this.prisma.premiumListing.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
        include: {
          property: {
            select: { id: true, title: true, city: true, locality: true },
          },
          user: { select: { id: true, fullName: true, email: true } },
          membership: { include: { plan: true } },
        },
      }),
    );
  }

  @Patch('premium-listings/:id/expire')
  async expirePremiumListing(@Param('id') id: string) {
    return serializePrisma(
      await this.prisma.premiumListing.update({
        where: { id },
        data: { status: 'EXPIRED', expiredAt: new Date() },
        include: {
          property: {
            select: { id: true, title: true, city: true, locality: true },
          },
          user: { select: { id: true, fullName: true, email: true } },
          membership: { include: { plan: true } },
        },
      }),
    );
  }

  @Get('payments')
  async getPayments() {
    return serializePrisma(
      await this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  @Get('invoices')
  async getInvoices() {
    return serializePrisma(
      await this.prisma.invoice.findMany({
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
        orderBy: { invoiceDate: 'desc' },
      }),
    );
  }

  @Patch('invoices/:id/paid')
  async markInvoicePaid(@Param('id') id: string) {
    return serializePrisma(
      await this.prisma.invoice.update({
        where: { id },
        data: { status: 'PAID' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      }),
    );
  }

  @Patch('invoices/:id/cancel')
  async cancelInvoice(@Param('id') id: string) {
    return serializePrisma(
      await this.prisma.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      }),
    );
  }
}
