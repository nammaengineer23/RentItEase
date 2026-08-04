import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { RegisterDeviceDto } from './dto/register-device.dto';
import { PushNotificationsService } from './push-notifications.service';

@ApiTags('Push Notifications')
@Controller('push-notifications')
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  // ==========================
  // Register Device
  // ==========================
  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  registerDevice(@CurrentUser() user: any, @Body() dto: RegisterDeviceDto) {
    return this.pushNotificationsService.registerDevice(user.id, dto);
  }

  // ==========================
  // Unregister Device
  // ==========================
  @Delete('unregister')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unregisterDevice(@CurrentUser() user: any, @Body('token') token: string) {
    return this.pushNotificationsService.unregisterDevice(user.id, token);
  }

  // ==========================
  // Test Notification
  // ==========================
  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async testNotification(@CurrentUser() user: any) {
    return this.pushNotificationsService.sendToUser(
      user.id,
      'RentItEase',
      '🎉 Push notifications are working!',
      {
        screen: 'home',
      },
    );
  }
}
