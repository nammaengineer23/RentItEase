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

  const devices =
    await this.prisma.userDevice.findMany({
      where: {
        userId,
      },
    });

  if (devices.length === 0) {
    return {
      success: false,
      message: 'No registered devices',
    };
  }

  const tokens = devices.map(
    (device) => device.token,
  );

  const response = await this.firebaseService.sendToDevices(
    tokens,
    title,
    body,
    data,
  );

  const invalidTokens = response?.responses
    .map((result, index) => ({ result, token: tokens[index] }))
    .filter(({ result }) => {
      const code = result.error?.code;
      return code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token';
    })
    .map(({ token }) => token) ?? [];

  if (invalidTokens.length > 0) {
    await this.prisma.userDevice.deleteMany({
      where: { token: { in: invalidTokens } },
    });
  }

  return response;
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
