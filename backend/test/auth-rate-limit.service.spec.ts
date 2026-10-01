import { HttpException } from '@nestjs/common';
import { AuthRateLimitService } from '../src/common/auth/auth-rate-limit.service';

describe('AuthRateLimitService', () => {
  function createHarness() {
    const rows = new Map<string, any>();

    const tx = {
      authRateLimit: {
        findUnique: jest.fn(async ({ where }: any) => rows.get(where.key) ?? null),
        upsert: jest.fn(async ({ where, create, update }: any) => {
          const existing = rows.get(where.key);
          const row = {
            id: existing?.id ?? 'rate-limit-id',
            key: where.key,
            windowStartedAt: existing ? update.windowStartedAt : create.windowStartedAt,
            failureCount: existing ? update.failureCount : create.failureCount,
            blockedUntil: existing ? update.blockedUntil : create.blockedUntil ?? null,
            updatedAt: new Date(),
          };
          rows.set(where.key, row);
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const existing = rows.get(where.key);
          const row = { ...existing, ...data, updatedAt: new Date() };
          rows.set(where.key, row);
          return row;
        }),
        deleteMany: jest.fn(async ({ where }: any) => {
          if (where.key) rows.delete(where.key);
          return { count: 1 };
        }),
      },
    };

    const prisma = {
      authRateLimit: tx.authRateLimit,
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    } as any;

    return { service: new AuthRateLimitService(prisma), prisma, rows };
  }

  it('allows failures up to the configured limit', async () => {
    const { service } = createHarness();

    await expect(service.assertAllowed('login-ip', '203.0.113.10', 3)).resolves.toBeUndefined();
    await service.recordFailure('login-ip', '203.0.113.10', 3);
    await service.recordFailure('login-ip', '203.0.113.10', 3);
    await service.recordFailure('login-ip', '203.0.113.10', 3);

    await expect(service.assertAllowed('login-ip', '203.0.113.10', 3)).rejects.toBeInstanceOf(HttpException);
  });

  it('blocks on the first failure beyond the limit', async () => {
    const { service, rows } = createHarness();

    await service.recordFailure('login-ip', '203.0.113.11', 2);
    await service.recordFailure('login-ip', '203.0.113.11', 2);

    await expect(service.recordFailure('login-ip', '203.0.113.11', 2)).rejects.toMatchObject({
      response: 'Too many authentication attempts. Please try again later.',
      status: 429,
    });

    const key = [...rows.keys()][0];
    expect(rows.get(key).blockedUntil).toBeInstanceOf(Date);
  });

  it('does not store the raw identifier in the database key', async () => {
    const { service, rows } = createHarness();

    await service.recordFailure('login-email', 'User@Example.com', 5);

    const key = [...rows.keys()][0];
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain('user@example.com');
  });

  it('normalizes scope values before hashing', async () => {
    const { service, rows } = createHarness();

    await service.recordFailure('login-email', ' User@Example.com ', 5);
    const firstKey = [...rows.keys()][0];

    await service.clear('login-email', 'USER@example.com');
    await service.recordFailure('login-email', 'user@example.com', 5);
    const secondKey = [...rows.keys()][0];

    expect(secondKey).toBe(firstKey);
  });

  it('resets the failure window after 15 minutes', async () => {
    const { service, rows } = createHarness();

    await service.recordFailure('login-ip', '203.0.113.12', 1);
    const key = [...rows.keys()][0];
    const oldWindow = new Date(Date.now() - 16 * 60 * 1000);
    rows.get(key).windowStartedAt = oldWindow;
    rows.get(key).failureCount = 1;
    rows.get(key).blockedUntil = null;

    await expect(service.assertAllowed('login-ip', '203.0.113.12', 1)).resolves.toBeUndefined();
    await service.recordFailure('login-ip', '203.0.113.12', 1);

    expect(rows.get(key).failureCount).toBe(1);
    expect(rows.get(key).windowStartedAt.getTime()).toBeGreaterThan(oldWindow.getTime());
  });

  it('clears a rate-limit record after successful authentication', async () => {
    const { service, rows } = createHarness();

    await service.recordFailure('login-ip', '203.0.113.13', 5);
    expect(rows.size).toBe(1);

    await service.clear('login-ip', '203.0.113.13');
    expect(rows.size).toBe(0);
  });
});
