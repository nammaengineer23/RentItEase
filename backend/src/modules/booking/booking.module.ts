import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [PrismaModule, NotificationsModule, PushNotificationsModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
