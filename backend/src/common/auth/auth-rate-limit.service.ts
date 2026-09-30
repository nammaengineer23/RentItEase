import { Injectable, TooManyRequestsException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRateLimitService {
  private readonly windowMs = 15 * 60 * 1000;
  private readonly blockMs = 15 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  private key(scope: string, value: string) {
    return crypto
      .createHash('sha256')
      .update(`${scope}:${value.trim().toLowerCase()}`)
      .digest('hex');
  }

  private async consume(scope: string, value: string, limit: number) {
    const key = this.key(scope, value);
    const now = new Date();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            const row = await tx.authRateLimit.findUnique({ where: { key } });

            if (!row || now.getTime() - row.windowStartedAt.getTime() >= this.windowMs) {
              await tx.authRateLimit.upsert({
                where: { key },
                create: { key, windowStartedAt: now, failureCount: 1 },
                update: { windowStartedAt: now, failureCount: 1, blockedUntil: null },
              });
              return;
            }

            if (row.blockedUntil && row.blockedUntil > now) {
              throw new TooManyRequestsException(
                'Too many authentication attempts. Please try again later.',
              );
            }

            const nextCount = row.failureCount + 1;
            if (nextCount > limit) {
              await tx.authRateLimit.update({
                where: { key },
                data: {
                  failureCount: nextCount,
                  blockedUntil: new Date(now.getTime() + this.blockMs),
                },
              });
              throw new TooManyRequestsException(
                'Too many authentication attempts. Please try again later.',
              );
            }

            await tx.authRateLimit.update({
              where: { key },
              data: { failureCount: nextCount },
            });
          },
          { isolationLevel: 'Serializable' },
        );
        return;
      } catch (error: any) {
        if (error instanceof TooManyRequestsException) throw error;
        if (error?.code !== 'P2034' || attempt === 2) throw error;
      }
    }
  }

  async assertAllowed(scope: string, value: string, limit: number) {
    const key = this.key(scope, value);
    const row = await this.prisma.authRateLimit.findUnique({ where: { key } });
    const now = new Date();

    if (row?.blockedUntil && row.blockedUntil > now) {
      throw new TooManyRequestsException(
        'Too many authentication attempts. Please try again later.',
      );
    }

    if (!row || now.getTime() - row.windowStartedAt.getTime() >= this.windowMs) {
      return;
    }

    if (row.failureCount >= limit) {
      throw new TooManyRequestsException(
        'Too many authentication attempts. Please try again later.',
      );
    }
  }

  async recordFailure(scope: string, value: string, limit: number) {
    await this.consume(scope, value, limit);
  }

  async clear(scope: string, value: string) {
    await this.prisma.authRateLimit.deleteMany({
      where: { key: this.key(scope, value) },
    });
  }

  async cleanup() {
    await this.prisma.authRateLimit.deleteMany({
      where: {
        updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
  }
}
