import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { OwnerRequestStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new UnauthorizedException(
        'Administrator accounts must be deactivated through the admin security workflow.',
      );
    }

    const anonymizedEmail = `deleted+${user.id}@redacted.rentitease.invalid`;
    const anonymizedPasswordHash = await bcrypt.hash(randomUUID(), 10);

    // Collect storage objects before owner properties are removed by the
    // database cascade. Object deletion happens after the transaction so a
    // database rollback never leaves the account without its files.
    const ownedProperties = await this.prisma.property.findMany({
      where: { ownerId: userId },
      select: {
        videoPublicId: true,
        images: { select: { publicId: true } },
      },
    });
    const storageObjectIds = ownedProperties.flatMap((property) => [
      property.videoPublicId,
      ...property.images.map((image) => image.publicId),
    ]).filter((value): value is string => Boolean(value));

    await this.prisma.$transaction(async (tx) => {
      await tx.userDevice.deleteMany({ where: { userId } });
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.otpCode.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.appFeedback.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.userSettings.deleteMany({ where: { userId } });

      await tx.message.updateMany({
        where: { senderId: userId },
        data: {
          text: '[deleted]',
          deletedAt: new Date(),
        },
      });

      await tx.socialMarketingConsent.updateMany({
        where: { ownerId: userId },
        data: {
          approved: false,
          revokedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: 'Deleted User',
          email: anonymizedEmail,
          phone: null,
          passwordHash: anonymizedPasswordHash,
          photoUrl: null,
          isActive: false,
          deletedAt: new Date(),
          ownerRequestStatus: OwnerRequestStatus.NONE,
        },
      });
    });

    await Promise.allSettled(
      storageObjectIds.map((publicId) => this.storageService.deleteImage(publicId)),
    );

    return {
      message: 'Account deleted successfully. Personal account data was anonymized and active sessions were revoked.',
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
