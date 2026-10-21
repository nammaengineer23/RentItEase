import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserRole, PropertyDocumentReviewStatus } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminModerationController } from './admin-moderation.controller';

describe('AdminModerationController authorization', () => {
  it('protects the controller with JWT and role guards and restricts it to admins', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AdminModerationController) as unknown[];
    const roles = Reflect.getMetadata(ROLES_KEY, AdminModerationController) as UserRole[];

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(roles).toEqual([UserRole.ADMIN]);
  });

  it('passes the rejection reason and request audit context to the moderation service', async () => {
    const moderation = {
      updatePropertyDocumentReview: jest.fn().mockResolvedValue({ success: true }),
      listPropertiesForDocumentReview: jest.fn(),
      updateReview: jest.fn(),
      cancelVisit: jest.fn(),
    };
    const audit = {} as any;
    const controller = new AdminModerationController(moderation as any, audit);
    const request = {
      user: { id: 'admin-1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    await controller.updatePropertyDocumentReview(
      'property-1',
      { status: PropertyDocumentReviewStatus.REJECTED, reason: 'Missing ownership document' },
      request,
    );

    expect(moderation.updatePropertyDocumentReview).toHaveBeenCalledWith(
      'property-1',
      PropertyDocumentReviewStatus.REJECTED,
      {
        adminId: 'admin-1',
        ipAddress: '127.0.0.1',
        device: 'test-agent',
        reason: 'Missing ownership document',
      },
    );
  });
});
