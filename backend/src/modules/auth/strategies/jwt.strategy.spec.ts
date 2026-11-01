import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy role resolution', () => {
  const prisma: any = { user: { findUnique: jest.fn() } };
  const config = {
    getOrThrow: jest.fn().mockReturnValue('test-access-secret'),
  } as unknown as ConfigService;

  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.resetAllMocks();
    config.getOrThrow = jest.fn().mockReturnValue('test-access-secret');
    strategy = new JwtStrategy(prisma, config);
  });

  it.each(['USER', 'OWNER', 'ADMIN'])(
    'loads the current %s role from PostgreSQL rather than trusting token claims',
    async (role) => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'person@example.com',
        fullName: 'RentItEase User',
        role,
        isActive: true,
        deletedAt: null,
      });

      const user = await strategy.validate({
        sub: 'user-1',
        role: 'ADMIN',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(user.role).toBe(role);
    },
  );

  it('rejects missing, inactive and soft-deleted accounts', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-1',
        isActive: false,
        deletedAt: null,
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        isActive: true,
        deletedAt: new Date(),
      });

    await expect(strategy.validate({ sub: 'missing' })).resolves.toBeNull();
    await expect(strategy.validate({ sub: 'inactive' })).resolves.toBeNull();
    await expect(strategy.validate({ sub: 'deleted' })).resolves.toBeNull();
  });
});
