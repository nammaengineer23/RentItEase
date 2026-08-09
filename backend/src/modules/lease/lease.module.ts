import { Module } from '@nestjs/common';

import { LeaseController } from './lease.controller';
import { LeaseService } from './lease.service';

import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  imports: [NotificationsModule, PushNotificationsModule],
  controllers: [LeaseController],
  providers: [LeaseService],
  exports: [LeaseService],
})
export class LeaseModule {}
