import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const audit = { record: jest.fn(), recordTx: jest.fn() };
  const socialMediaService = { onPropertyApproved: jest.fn().mockResolvedValue(undefined) };
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: { count: jest.fn() },
    lease: { count: jest.fn() },
    membership: { count: jest.fn() },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
    review: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const context = { adminId: 'admin-1', ipAddress: '127.0.0.1', device: 'test-device', reason: 'security review' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects self-deactivation', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN, isActive: true });
    const service = new AdminService(prisma, socialMediaService as any, audit as any);
    await expect(service.deactivateUser('admin-1', 'admin-1', context)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deactivation of the last active admin', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: UserRole.ADMIN, isActive: true })
      .mockResolvedValueOnce({ id: 'admin-2', role: UserRole.ADMIN, isActive: true });
    prisma.user.count.mockResolvedValue(1);
    const service = new AdminService(prisma, socialMediaService as any, audit as any);
    await expect(service.deactivateUser('admin-2', 'admin-1', context)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects self role changes', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN, isActive: true });
    const service = new AdminService(prisma, socialMediaService as any, audit as any);
    await expect(service.updateUserRole('admin-1', UserRole.USER, 'admin-1', context)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deleting a user with owned properties', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }: any) =>
      where.id === 'admin-1'
        ? { id: 'admin-1', role: UserRole.ADMIN, isActive: true }
        : { id: 'owner-1', role: UserRole.OWNER, isActive: true, fullName: 'Owner', email: 'owner@example.com' },
    );
    prisma.user.count.mockResolvedValue(2);
    prisma.property.count = jest.fn().mockResolvedValue(1);
    prisma.booking.count.mockResolvedValue(0);
    prisma.lease.count.mockResolvedValue(0);
    prisma.membership.count.mockResolvedValue(0);
    const service = new AdminService(prisma, socialMediaService as any, audit as any);
    await expect(service.deleteUser('owner-1', 'admin-1', context)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a user role change in the durable audit service', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: UserRole.ADMIN, isActive: true })
      .mockResolvedValueOnce({ id: 'user-1', role: UserRole.USER, isActive: true, ownerRequestStatus: 'NONE' });
    prisma.user.update.mockResolvedValue({ id: 'user-1', role: UserRole.OWNER, isActive: true });
    const service = new AdminService(prisma, socialMediaService as any, audit as any);
    await service.updateUserRole('user-1', UserRole.OWNER, 'admin-1', context);
    expect(audit.recordTx).toHaveBeenCalledWith(expect.anything(), context, 'USER_ROLE_CHANGE', 'USER', 'user-1', expect.any(Object), expect.any(Object));
  });

  it('rejects a non-admin actor even when the target exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: UserRole.USER, isActive: true });
    const service = new AdminService(prisma, socialMediaService as any, audit as any);
    await expect(service.activateUser('target', 'user-1', context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
