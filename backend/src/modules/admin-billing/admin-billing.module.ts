import { Module } from '@nestjs/common';
import { AdminBillingController } from './admin-billing.controller';
import { AdminMembershipManagementController } from './admin-membership-management.controller';
import { AdminPlanConfigController } from './admin-plan-config.controller';

@Module({
  controllers: [
    AdminBillingController,
    AdminPlanConfigController,
    AdminMembershipManagementController,
  ],
})
export class AdminBillingModule {}
