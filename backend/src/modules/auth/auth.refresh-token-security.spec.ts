import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService refresh-token security', () => {
  const refreshSecret = 'test-refresh-secret';
  const accessSecret = 'test-access-secret';

  function createService() {
    const service = Object.create(AuthService.prototype) as any;
    service.prisma = {
      user: {
        findUnique: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    service.jwtService = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(async (payload: any, options: any) =>
        options.secret === refreshSecret
          ? `refresh-${payload.jti}`
          : `access-${payload.sub}`,
      ),
      decode: jest.fn((token: string) => ({
        jti: token.replace('refresh-', ''),
        familyId: 'family-1',
      })),
    };
    return service;
  }

  let tx: any;

  beforeEach(() => {
    tx = {
      refreshToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
    };
    process.env.JWT_REFRESH_SECRET = refreshSecret;
    process.env.JWT_ACCESS_SECRET = accessSecret;
  });

  it('rotates a refresh token atomically and preserves the token family', async () => {
    const service = createService();
    const refreshToken = 'old-refresh-token';
    const storedHash = await bcrypt.hash(refreshToken, 4);

    service.jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      jti: 'jti-1',
      familyId: 'family-1',
    });
    service.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      isActive: true,
    });
    service.prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-row-1',
      jti: 'jti-1',
      familyId: 'family-1',
      userId: 'user-1',
      token: storedHash,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      revokedAt: null,
    });
    tx.refreshToken.updateMany.mockImplementation(async ({ data }: any) => {
      service.prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-row-1',
        jti: 'jti-1',
        familyId: 'family-1',
        userId: 'user-1',
        token: storedHash,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: data.usedAt,
        revokedAt: null,
      });
      return { count: 1 };
    });

    const result = await service.refreshToken(refreshToken);

    expect(result.success).toBe(true);
    expect(tx.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'token-row-1',
          usedAt: null,
          revokedAt: null,
        },
      }),
    );
    expect(tx.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          familyId: 'family-1',
        }),
      }),
    );
  });

  it('revokes the entire refresh-token family when a rotated token is reused', async () => {
    const service = createService();
    const refreshToken = 'reused-refresh-token';

    service.jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      jti: 'jti-old',
      familyId: 'family-1',
    });
    service.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      isActive: true,
    });
    service.prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-row-old',
      jti: 'jti-old',
      familyId: 'family-1',
      userId: 'user-1',
      token: await bcrypt.hash(refreshToken, 4),
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      revokedAt: null,
    });

    await expect(service.refreshToken(refreshToken)).rejects.toThrow(
      'Refresh token reuse detected',
    );

    expect(service.prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', familyId: 'family-1' },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
