import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '../../database/database.module';
import { AdminAuditModule } from '../admin/admin-audit.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  controllers: [UsersController],
  imports: [DatabaseModule, AdminAuditModule, PushNotificationsModule],
  providers: [UsersService],
})
export class UsersModule {}
