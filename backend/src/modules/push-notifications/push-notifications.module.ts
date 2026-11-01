import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { FirebaseModule } from '../../firebase/firebase.module';

import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { NotificationOutboxWorker } from './notification-outbox.worker';

@Module({
  imports: [
    DatabaseModule,
    FirebaseModule,
  ],
  controllers: [PushNotificationsController],
  providers: [PushNotificationsService, NotificationOutboxWorker],
  exports: [PushNotificationsService],
})
export class PushNotificationsModule {}