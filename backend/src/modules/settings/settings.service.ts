import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';

import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // GET SETTINGS
  // =========================================================

  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: {
        userId,
      },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
        },
      });
    }

    return settings;
  }

  // =========================================================
  // UPDATE SETTINGS
  // =========================================================

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    await this.ensureUserExists(userId);

    return this.prisma.userSettings.upsert({
      where: {
        userId,
      },
      update: {
        ...(dto.pushNotifications !== undefined && {
          pushNotifications: dto.pushNotifications,
        }),

        ...(dto.emailNotifications !== undefined && {
          emailNotifications: dto.emailNotifications,
        }),

        ...(dto.smsNotifications !== undefined && {
          smsNotifications: dto.smsNotifications,
        }),

        ...(dto.darkMode !== undefined && {
          darkMode: dto.darkMode,
        }),

        ...(dto.language !== undefined && {
          language: dto.language,
        }),
      },
      create: {
        userId,
        pushNotifications: dto.pushNotifications ?? true,
        emailNotifications: dto.emailNotifications ?? true,
        smsNotifications: dto.smsNotifications ?? false,
        darkMode: dto.darkMode ?? false,
        language: dto.language ?? 'en',
      },
    });
  }

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Password authentication is not available for this account',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash: hashedPassword,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  // =========================================================
  // DELETE ACCOUNT
  // =========================================================

  async deleteAccount(userId: string) {
    await this.ensureUserExists(userId);

    await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return {
      message: 'Account deleted successfully',
    };
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
