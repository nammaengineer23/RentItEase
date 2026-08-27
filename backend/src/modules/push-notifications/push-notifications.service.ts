import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { RegisterDeviceDto } from './dto/register-device.dto';
import { FirebaseService } from '../../firebase/firebase.service';
@Injectable()
export class PushNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  // ==========================
  // Register Device
  // ==========================
  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    return this.prisma.userDevice.upsert({
      where: {
        token: dto.token,
      },
      update: {
        platform: dto.platform,
        userId,
      },
      create: {
        token: dto.token,
        platform: dto.platform,
        userId,
      },
    });
  }

  // ==========================
  // Send Notification To User
  // ==========================
  async sendToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const settings = await this.prisma.userSettings.findUnique({
    where: { userId },
    select: { pushNotifications: true },
  });

  if (settings?.pushNotifications === false) {
    return {
      success: false,
      message: 'Push notifications disabled by user',
    };
  }

  console.log('==============================');
  console.log('📨 sendToUser() called');
  console.log('User ID:', userId);

  const devices =
    await this.prisma.userDevice.findMany({
      where: {
        userId,
      },
    });

  console.log('Devices found:', devices.length);

  if (devices.length === 0) {
    console.log('❌ No registered devices');
    console.log('==============================');

    return {
      success: false,
      message: 'No registered devices',
    };
  }

  const tokens = devices.map(
    (device) => device.token,
  );

  console.log('FCM Tokens:', tokens);
  console.log('➡️ Calling Firebase...');
  console.log('==============================');

  return this.firebaseService.sendToDevices(
    tokens,
    title,
    body,
    data,
  );
}
  // ==========================
  // Remove Device
  // ==========================
  async unregisterDevice(userId: string, token: string) {
    await this.prisma.userDevice.deleteMany({
      where: {
        userId,
        token,
      },
    });

    return {
      message: 'Device removed successfully',
    };
  }
}
