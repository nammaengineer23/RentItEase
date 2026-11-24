import { Module } from '@nestjs/common';

import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { ListingAiService } from './listing-ai.service';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../../storage/storage.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  imports: [DatabaseModule, AuthModule, StorageModule, PushNotificationsModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, ListingAiService],
})
export class PropertiesModule {}
