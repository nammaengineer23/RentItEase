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
    const row = await this.prisma.authRateLimit.findUnique({ where: { key } });

    if (!row || now.getTime() - row.windowStartedAt.getTime() >= this.windowMs) {
      await this.prisma.authRateLimit.upsert({
        where: { key },
        create: {
          key,
          windowStartedAt: now,
          failureCount: 1,
        },
        update: {
          windowStartedAt: now,
          failureCount: 1,
          blockedUntil: null,
        },
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
      await this.prisma.authRateLimit.update({
        where: { key },
        data: { failureCount: nextCount, blockedUntil: new Date(now.getTime() + this.blockMs) },
      });
      throw new TooManyRequestsException(
        'Too many authentication attempts. Please try again later.',
      );
    }

    await this.prisma.authRateLimit.update({
      where: { key },
      data: { failureCount: nextCount },
    });
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
