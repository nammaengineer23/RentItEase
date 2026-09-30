import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService Firebase UID mapping', () => {
  const firebaseService = { verifyToken: jest.fn() };
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  };
  const jwtService = { signAsync: jest.fn() };
  const mailService = {};
  const otpService = {};

  let service: AuthService;

  const user = {
    id: 'user-1',
    fullName: 'Test User',
    email: 'user@example.com',
    phone: '+919876543210',
    role: 'USER',
    photoUrl: null,
    isActive: true,
    firebaseUid: null as string | null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as any,
      jwtService as any,
      firebaseService as any,
      mailService as any,
      otpService as any,
    );
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-1' });
  });

  it('uses the persisted Firebase UID before phone/email lookup', async () => {
    firebaseService.verifyToken.mockResolvedValue({
      uid: 'firebase-123',
      phone_number: '+919876543210',
      email: 'user@example.com',
      email_verified: true,
    });
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.firebaseLogin('id-token');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseUid: 'firebase-123' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('binds a verified Firebase UID to an existing unbound account', async () => {
    firebaseService.verifyToken.mockResolvedValue({
      uid: 'firebase-456',
      phone_number: '+919876543210',
      email: 'user@example.com',
      email_verified: true,
    });
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValue({
      ...user,
      firebaseUid: 'firebase-456',
    });

    await service.firebaseLogin('id-token');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { firebaseUid: 'firebase-456' },
    });
  });

  it('persists the Firebase UID when creating a new verified account', async () => {
    firebaseService.verifyToken.mockResolvedValue({
      uid: 'firebase-new',
      email: 'new@example.com',
      email_verified: true,
      name: 'New User',
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      ...user,
      id: 'user-new',
      email: 'new@example.com',
      phone: null,
      fullName: 'New User',
      firebaseUid: 'firebase-new',
    });

    await service.firebaseLogin('id-token', true);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        firebaseUid: 'firebase-new',
        fullName: 'New User',
        phone: null,
        email: 'new@example.com',
        passwordHash: '',
        photoUrl: undefined,
      },
    });
  });

  it('rejects an unverified Firebase email for new account creation', async () => {
    firebaseService.verifyToken.mockResolvedValue({
      uid: 'firebase-unverified',
      email: 'new@example.com',
      email_verified: false,
    });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.firebaseLogin('id-token', true)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects linking when an existing fallback account is already bound to another Firebase UID', async () => {
    firebaseService.verifyToken.mockResolvedValue({
      uid: 'firebase-attacker',
      phone_number: '+919876543210',
      email: 'user@example.com',
      email_verified: true,
    });
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...user, firebaseUid: 'firebase-original' });

    await expect(service.firebaseLogin('id-token')).rejects.toThrow(
      'Firebase identity mismatch.',
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
