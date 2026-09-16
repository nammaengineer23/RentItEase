import { Module } from "@nestjs/common";
import { AdminBillingController } from "./admin-billing.controller";
import { AdminPlanConfigController } from "./admin-plan-config.controller";

@Module({
  controllers: [AdminBillingController, AdminPlanConfigController],
})
export class AdminBillingModule {}
