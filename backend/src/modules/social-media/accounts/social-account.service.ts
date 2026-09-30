import { BadRequestException, Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';

export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';

@Injectable()
export class SocialAccountService {
  constructor(private readonly prisma: PrismaService) {}

  private key() {
    const raw = process.env.SOCIAL_ACCOUNT_ENCRYPTION_KEY;
    if (!raw || !/^[a-f0-9]{64}$/i.test(raw)) throw new BadRequestException('Social account encryption is not configured.');
    return Buffer.from(raw, 'hex');
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join('.');
  }

  private decrypt(value: string) {
    const [iv, tag, data] = value.split('.');
    if (!iv || !tag || !data) throw new Error('Stored social credential is invalid.');
    const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  }

  async connect(input: { platform: SocialPlatform; accountId: string; accountName?: string; accessToken: string; refreshToken?: string; expiresAt?: Date }) {
    if (!input.accountId.trim() || !input.accessToken.trim()) throw new BadRequestException('Social account ID and access token are required.');
    const connection = await this.prisma.socialAccountConnection.upsert({
      where: { platform_accountId: { platform: input.platform, accountId: input.accountId.trim() } },
      create: { platform: input.platform, accountId: input.accountId.trim(), accountName: input.accountName?.trim(), encryptedAccessToken: this.encrypt(input.accessToken), encryptedRefreshToken: input.refreshToken ? this.encrypt(input.refreshToken) : null, expiresAt: input.expiresAt, active: true },
      update: { accountName: input.accountName?.trim(), encryptedAccessToken: this.encrypt(input.accessToken), encryptedRefreshToken: input.refreshToken ? this.encrypt(input.refreshToken) : undefined, expiresAt: input.expiresAt, active: true },
    });
    return { id: connection.id, platform: connection.platform, accountId: connection.accountId, accountName: connection.accountName, active: connection.active, expiresAt: connection.expiresAt };
  }

  async disconnect(platform: SocialPlatform, accountId: string) {
    const result = await this.prisma.socialAccountConnection.updateMany({ where: { platform, accountId, active: true }, data: { active: false } });
    return { disconnected: result.count > 0 };
  }

  async getConnectionState() {
    const rows = await this.prisma.socialAccountConnection.findMany({ select: { platform: true, accountId: true, accountName: true, active: true, expiresAt: true }, orderBy: { updatedAt: 'desc' } });
    return rows.map((row) => ({ platform: row.platform, accountId: row.accountId, accountName: row.accountName, active: row.active && (!row.expiresAt || row.expiresAt > new Date()), expiresAt: row.expiresAt }));
  }

  async getCredentials(platform: SocialPlatform, fallback: { accessToken?: string; refreshToken?: string; accountId?: string }) {
    const row = await this.prisma.socialAccountConnection.findFirst({
      where: { platform, active: true, ...(fallback.accountId ? { accountId: fallback.accountId } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    if (!row) return fallback;
    if (row.expiresAt && row.expiresAt <= new Date() && !row.encryptedRefreshToken) return {};
    return {
      accessToken: this.decrypt(row.encryptedAccessToken),
      refreshToken: row.encryptedRefreshToken ? this.decrypt(row.encryptedRefreshToken) : fallback.refreshToken,
      accountId: row.accountId,
    };
  }
}
