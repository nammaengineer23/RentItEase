import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService Firebase Google identity', () => {
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: { create: jest.fn() },
  };
  const jwtService: any = { signAsync: jest.fn() };
  const firebaseService: any = { verifyToken: jest.fn() };
  const mailService: any = {};
  const otpService: any = {};
  let service: AuthService;

  const decoded = {
    sub: 'firebase-uid-1',
    email: 'person@example.com',
    email_verified: true,
    name: 'Google Person',
    picture: 'https://example.com/photo.png',
    firebase: { sign_in_provider: 'google.com' },
  };

  const account = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-1',
    fullName: 'Existing Person',
    email: 'person@example.com',
    phone: null,
    role: 'OWNER',
    photoUrl: null,
    firebaseUid: null,
    isActive: true,
    deletedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma,
      jwtService,
      firebaseService,
      mailService,
      otpService,
    );
    firebaseService.verifyToken.mockResolvedValue(decoded);
    jwtService.signAsync
      .mockResolvedValueOnce('rentitease-access-token')
      .mockResolvedValueOnce('rentitease-refresh-token');
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-1' });
  });

  it('uses the immutable Firebase UID first and preserves the RentItEase session contract', async () => {
    const user = account({ firebaseUid: 'firebase-uid-1' });
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.firebaseLogin('firebase-id-token');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseUid: 'firebase-uid-1' },
    });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      message: 'Login successful.',
      accessToken: 'rentitease-access-token',
      refreshToken: 'rentitease-refresh-token',
      user: { id: 'user-1', role: 'OWNER' },
    });
  });

  it('links one existing account only after verified Google email proof', async () => {
    const existing = account();
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...existing, firebaseUid: 'firebase-uid-1' });
    prisma.user.findMany.mockResolvedValue([existing]);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.firebaseLogin('firebase-id-token');

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', firebaseUid: null },
      data: { firebaseUid: 'firebase-uid-1' },
    });
  });

  it('rejects ambiguous legacy email matches rather than guessing an account', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([account(), account({ id: 'user-2' })]);

    await expect(service.firebaseLogin('firebase-id-token')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an account already linked to a different Firebase UID', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([
      account({ firebaseUid: 'another-firebase-uid' }),
    ]);

    await expect(service.firebaseLogin('firebase-id-token')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects unverified Google email before attempting account lookup', async () => {
    firebaseService.verifyToken.mockResolvedValue({
      ...decoded,
      email_verified: false,
    });

    await expect(service.firebaseLogin('firebase-id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('rejects non-Google Firebase providers on the Google login endpoint', async () => {
    firebaseService.verifyToken.mockResolvedValue({
      ...decoded,
      firebase: { sign_in_provider: 'phone' },
    });

    await expect(service.firebaseLogin('firebase-id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('does not create an account unless the caller explicitly requests account creation', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findMany.mockResolvedValue([]);

    await expect(service.firebaseLogin('firebase-id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a new account with its Firebase UID when account creation is requested', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(account({ firebaseUid: 'firebase-uid-1' }));
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.create.mockResolvedValue(
      account({ firebaseUid: 'firebase-uid-1' }),
    );

    const result = await service.firebaseLogin('firebase-id-token', true);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'person@example.com',
        firebaseUid: 'firebase-uid-1',
        passwordHash: '',
      }),
    });
    expect(result.user.role).toBe('OWNER');
  });

  it.each([
    ['inactive', { isActive: false, deletedAt: null }],
    ['soft-deleted', { isActive: true, deletedAt: new Date() }],
  ])('rejects %s RentItEase accounts', async (_label, overrides) => {
    prisma.user.findUnique.mockResolvedValue(account(overrides));

    await expect(service.firebaseLogin('firebase-id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('rejects a Firebase token rejected by Firebase Admin (including revoked sessions)', async () => {
    firebaseService.verifyToken.mockRejectedValue(
      new UnauthorizedException('Invalid, expired, revoked, or disabled Firebase session.'),
    );

    await expect(service.firebaseLogin('revoked-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
