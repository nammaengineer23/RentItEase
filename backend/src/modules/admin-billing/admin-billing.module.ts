import { Module } from "@nestjs/common";
import { AdminBillingController } from "./admin-billing.controller";

@Module({
  controllers: [AdminBillingController],
})
export class AdminBillingModule {}
