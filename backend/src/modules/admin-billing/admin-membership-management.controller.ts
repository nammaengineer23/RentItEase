import { BadRequestException, Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { MembershipStatus, Prisma, UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin Billing')
@ApiBearerAuth()
@Controller('admin/billing/memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminMembershipManagementController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch(':id')
  async updateMembership(
    @Param('id') id: string,
    @Body() body: { planId?: string; status?: MembershipStatus; extendDays?: number; notes?: string; autoRenew?: boolean },
  ) {
    const membership = await this.prisma.membership.findUnique({ where: { id }, include: { plan: true } });
    if (!membership) throw new BadRequestException('Membership not found.');

    let plan = membership.plan;
    if (body.planId && body.planId !== membership.planId) {
      const next = await this.prisma.membershipPlan.findUnique({ where: { id: body.planId } });
      if (!next || !next.isActive) throw new BadRequestException('An active membership plan is required.');
      plan = next;
    }

    const extendDays = body.extendDays === undefined ? 0 : Number(body.extendDays);
    if (!Number.isInteger(extendDays) || extendDays < 0 || extendDays > 3650) {
      throw new BadRequestException('Extension must be between 0 and 3650 days.');
    }

    if (body.status === MembershipStatus.ACTIVE) {
      const otherActive = await this.prisma.membership.findFirst({ where: { userId: membership.userId, status: MembershipStatus.ACTIVE, NOT: { id } } });
      if (otherActive) throw new BadRequestException('User already has another active membership.');
    }

    const now = new Date();
    let endDate = membership.endDate;
    if (body.planId && body.planId !== membership.planId) {
      const base = membership.startDate ?? now;
      endDate = new Date(base);
      endDate.setDate(endDate.getDate() + plan.durationDays);
    }
    if (extendDays > 0) {
      const base = endDate && endDate > now ? endDate : now;
      endDate = new Date(base);
      endDate.setDate(endDate.getDate() + extendDays);
    }

    const status = body.status ?? membership.status;
    return serializePrisma(await this.prisma.membership.update({
      where: { id },
      data: {
        ...(body.planId ? { planId: plan.id, amount: membership.isTrial ? new Prisma.Decimal(0) : plan.price } : {}),
        ...(body.status ? { status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes.trim() || null } : {}),
        ...(body.autoRenew !== undefined ? { autoRenew: body.autoRenew } : {}),
        ...(endDate ? { endDate } : {}),
        ...(status === MembershipStatus.ACTIVE ? { activatedAt: membership.activatedAt ?? now, startDate: membership.startDate ?? now, cancelledAt: null, expiredAt: null } : {}),
        ...(status === MembershipStatus.CANCELLED ? { cancelledAt: now } : {}),
        ...(status === MembershipStatus.EXPIRED ? { expiredAt: now } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        plan: true,
        invoices: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true, invoiceDate: true }, orderBy: { invoiceDate: 'desc' }, take: 5 },
      },
    }));
  }
}
