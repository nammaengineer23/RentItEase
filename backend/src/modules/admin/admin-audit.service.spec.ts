import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService', () => {
  const prisma = {
    adminAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('persists complete audit metadata including before/after and request context', async () => {
    prisma.adminAuditLog.create.mockResolvedValue({ id: 'audit-1' });
    const service = new AdminAuditService(prisma as any);
    const context = {
      adminId: 'admin-1',
      ipAddress: '203.0.113.10',
      device: 'Mozilla/test',
      reason: 'security review',
    };

    await service.record(
      context,
      'USER_ROLE_CHANGE',
      'USER',
      'user-1',
      { role: 'USER' },
      { role: 'OWNER' },
    );

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-1',
        action: 'USER_ROLE_CHANGE',
        resource: 'USER',
        resourceId: 'user-1',
        before: { role: 'USER' },
        after: { role: 'OWNER' },
        ipAddress: '203.0.113.10',
        device: 'Mozilla/test',
        reason: 'security review',
      },
    });
  });

  it('supports bounded audit queries without exposing mutation operations', async () => {
    prisma.adminAuditLog.findMany.mockResolvedValue([]);
    const service = new AdminAuditService(prisma as any);

    await service.list(500, {
      action: 'PROPERTY_APPROVE',
      resource: 'PROPERTY',
      resourceId: 'property-1',
    });

    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 200,
        where: {
          action: 'PROPERTY_APPROVE',
          resource: 'PROPERTY',
          resourceId: 'property-1',
        },
      }),
    );
  });
});
