import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../database/prisma.service';

interface PlanConfigBody {
  name?: string;
  code?: 'FREE' | 'PREMIUM';
  description?: string;
  price?: number;
  durationDays?: number;
  trialDays?: number;
  features?: string[];
  displayOrder?: number;
  isActive?: boolean;
}

@ApiTags('Admin Billing')
@ApiBearerAuth()
@Controller('admin/billing/plan-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPlanConfigController {
  constructor(private readonly prisma: PrismaService) {}

  private validate(body: PlanConfigBody, creating = false) {
    if (creating && (!body.name?.trim() || !body.code)) {
      throw new BadRequestException('Plan name and code are required.');
    }
    if (body.price !== undefined && (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)) {
      throw new BadRequestException('Plan price must be zero or greater.');
    }
    for (const [key, value] of [['durationDays', body.durationDays], ['trialDays', body.trialDays], ['displayOrder', body.displayOrder]] as const) {
      if (value !== undefined && (!Number.isInteger(Number(value)) || Number(value) < 0)) {
        throw new BadRequestException(`${key} must be a non-negative integer.`);
      }
    }
    if (body.durationDays !== undefined && Number(body.durationDays) < 1) {
      throw new BadRequestException('durationDays must be at least 1.');
    }
    if (body.features !== undefined && (!Array.isArray(body.features) || body.features.some((item) => typeof item !== 'string'))) {
      throw new BadRequestException('features must be a list of strings.');
    }
  }

  @Get()
  async list() {
    return this.prisma.$queryRawUnsafe(`
      SELECT id, name, code, description, price, "durationDays", "trialDays",
             features, "displayOrder", "isActive", "createdAt", "updatedAt"
      FROM "MembershipPlan"
      ORDER BY "displayOrder" ASC, price ASC, "durationDays" ASC
    `);
  }

  @Post()
  async create(@Body() body: PlanConfigBody) {
    this.validate(body, true);
    const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const features = JSON.stringify((body.features ?? []).map((item) => item.trim()).filter(Boolean));
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO "MembershipPlan"
        (id, name, code, description, price, "durationDays", "trialDays", features, "displayOrder", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3::"MembershipPlanCode", $4, $5::numeric, $6, $7, $8::jsonb, $9, $10, NOW(), NOW())
      RETURNING *
    `, id, body.name!.trim(), body.code!, body.description?.trim() || null,
      Number(body.price ?? 0), Number(body.durationDays ?? 30), Number(body.trialDays ?? 0),
      features, Number(body.displayOrder ?? 0), body.isActive ?? true);
    return rows[0];
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: PlanConfigBody) {
    this.validate(body);
    const current = await this.prisma.$queryRawUnsafe<any[]>(
      'SELECT * FROM "MembershipPlan" WHERE id = $1 LIMIT 1', id,
    );
    if (!current.length) throw new BadRequestException('Membership plan not found.');
    const plan = current[0];
    const features = JSON.stringify(
      (body.features ?? (Array.isArray(plan.features) ? plan.features : []))
        .map((item: string) => item.trim()).filter(Boolean),
    );
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      UPDATE "MembershipPlan" SET
        name=$2, description=$3, price=$4::numeric, "durationDays"=$5,
        "trialDays"=$6, features=$7::jsonb, "displayOrder"=$8, "isActive"=$9,
        "updatedAt"=NOW()
      WHERE id=$1 RETURNING *
    `, id, body.name?.trim() ?? plan.name, body.description !== undefined ? body.description.trim() || null : plan.description,
      Number(body.price ?? plan.price), Number(body.durationDays ?? plan.durationDays),
      Number(body.trialDays ?? plan.trialDays), features, Number(body.displayOrder ?? plan.displayOrder),
      body.isActive ?? plan.isActive);
    return rows[0];
  }
}
