import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AdminAuditContext {
  adminId: string;
  ipAddress?: string | null;
  device?: string | null;
  reason?: string | null;
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  private json(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) return undefined;
    return JSON.parse(
      JSON.stringify(value, (_key, current) =>
        typeof current === 'bigint' ? current.toString() : current,
      ),
    ) as Prisma.InputJsonValue;
  }

  async record(
    context: AdminAuditContext,
    action: string,
    resource: string,
    resourceId: string | null,
    before?: unknown,
    after?: unknown,
  ) {
    return this.prisma.adminAuditLog.create({
      data: {
        adminId: context.adminId,
        action,
        resource,
        resourceId,
        before: this.json(before),
        after: this.json(after),
        ipAddress: context.ipAddress ?? null,
        device: context.device ?? null,
        reason: context.reason ?? null,
      },
    });
  }

  async recordTx(
    tx: Prisma.TransactionClient,
    context: AdminAuditContext,
    action: string,
    resource: string,
    resourceId: string | null,
    before?: unknown,
    after?: unknown,
  ) {
    return tx.adminAuditLog.create({
      data: {
        adminId: context.adminId,
        action,
        resource,
        resourceId,
        before: this.json(before),
        after: this.json(after),
        ipAddress: context.ipAddress ?? null,
        device: context.device ?? null,
        reason: context.reason ?? null,
      },
    });
  }

  async list(limit = 100) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    return this.prisma.adminAuditLog.findMany({
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  }
}
