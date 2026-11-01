import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationOutbox, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class NotificationOutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationOutboxWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('PUSH_OUTBOX_WORKER_ENABLED', true)) {
      this.logger.log('Push outbox worker disabled by configuration.');
      return;
    }
    const interval = this.config.get<number>('PUSH_OUTBOX_POLL_INTERVAL_MS', 5000);
    void this.drain();
    this.timer = setInterval(() => void this.drain(), interval);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const batchSize = this.config.get<number>('PUSH_OUTBOX_BATCH_SIZE', 10);
      const events = await this.claimBatch(batchSize);
      for (const event of events) await this.processEvent(event);
    } catch (error) {
      this.logger.error(`Push outbox poll failed: ${this.safeError(error)}`);
    } finally {
      this.running = false;
    }
  }

  private async claimBatch(limit: number): Promise<NotificationOutbox[]> {
    const lockToken = randomUUID();
    return this.prisma.$queryRaw<NotificationOutbox[]>(Prisma.sql`
      WITH candidates AS (
        SELECT "id"
        FROM "NotificationOutbox"
        WHERE (
          ("status" IN ('PENDING', 'RETRY') AND "availableAt" <= NOW())
          OR ("status" = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '2 minutes')
        )
        ORDER BY "availableAt" ASC, "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      UPDATE "NotificationOutbox" AS event
      SET "status" = 'PROCESSING',
          "lockedAt" = NOW(),
          "lockToken" = ${lockToken},
          "updatedAt" = NOW()
      FROM candidates
      WHERE event."id" = candidates."id"
      RETURNING event.*
    `);
  }

  private async processEvent(event: NotificationOutbox): Promise<void> {
    try {
      const [settings, devices] = await Promise.all([
        this.prisma.userSettings.findUnique({
          where: { userId: event.userId },
          select: { pushNotifications: true },
        }),
        this.prisma.userDevice.findMany({
          where: { userId: event.userId },
          select: { id: true, token: true },
        }),
      ]);

      if (settings?.pushNotifications === false || devices.length === 0) {
        await this.finishEvent(
          event,
          'SKIPPED',
          settings?.pushNotifications === false ? 'Push notifications disabled by user' : 'No registered devices',
        );
        return;
      }

      await this.prisma.notificationOutboxDelivery.createMany({
        data: devices.map((device) => ({ eventId: event.id, deviceId: device.id })),
        skipDuplicates: true,
      });

      const deliveries = await this.prisma.notificationOutboxDelivery.findMany({
        where: {
          eventId: event.id,
          status: { in: ['PENDING', 'RETRY', 'PROCESSING'] },
          nextAttemptAt: { lte: new Date() },
        },
        include: { device: { select: { id: true, token: true } } },
        orderBy: { createdAt: 'asc' },
      });
      const fcmData = this.toFcmData(event.data);

      for (const delivery of deliveries) {
        const claimed = await this.prisma.notificationOutboxDelivery.updateMany({
          where: { id: delivery.id, status: { in: ['PENDING', 'RETRY', 'PROCESSING'] } },
          data: { status: 'PROCESSING', attemptCount: { increment: 1 } },
        });
        if (claimed.count !== 1) continue;

        const attempt = delivery.attemptCount + 1;
        if (attempt > 8) {
          await this.prisma.notificationOutboxDelivery.update({
            where: { id: delivery.id },
            data: { status: 'FAILED', lastError: 'Maximum delivery attempts exceeded' },
          });
          continue;
        }

        try {
          await this.firebase.sendToDevice(delivery.device.token, event.title, event.body, fcmData);
          await this.prisma.notificationOutboxDelivery.update({
            where: { id: delivery.id },
            data: { status: 'SENT', sentAt: new Date(), lastError: null },
          });
        } catch (error) {
          const code = this.firebaseErrorCode(error);
          if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
            await this.prisma.userDevice.deleteMany({ where: { id: delivery.device.id } });
            continue;
          }
          const terminal = attempt >= 8;
          const delayMs = Math.min(60 * 60 * 1000, 1000 * 2 ** Math.min(attempt - 1, 12));
          await this.prisma.notificationOutboxDelivery.update({
            where: { id: delivery.id },
            data: {
              status: terminal ? 'FAILED' : 'RETRY',
              nextAttemptAt: new Date(Date.now() + delayMs),
              lastError: this.safeError(error),
            },
          });
        }
      }

      const remaining = await this.prisma.notificationOutboxDelivery.findMany({
        where: { eventId: event.id, status: { in: ['PENDING', 'RETRY', 'PROCESSING'] } },
        select: { nextAttemptAt: true },
      });
      if (remaining.length) {
        const nextAttemptAt = remaining.reduce(
          (earliest, item) => item.nextAttemptAt < earliest ? item.nextAttemptAt : earliest,
          remaining[0].nextAttemptAt,
        );
        await this.releaseForRetry(event, nextAttemptAt);
      } else {
        const failed = await this.prisma.notificationOutboxDelivery.count({
          where: { eventId: event.id, status: 'FAILED' },
        });
        await this.finishEvent(event, failed ? 'PARTIAL_FAILURE' : 'COMPLETED');
      }
    } catch (error) {
      this.logger.error(`Push outbox event ${event.id} failed: ${this.safeError(error)}`);
      await this.releaseForRetry(event, new Date(Date.now() + 30_000));
    }
  }

  private async releaseForRetry(event: NotificationOutbox, availableAt: Date): Promise<void> {
    await this.prisma.notificationOutbox.updateMany({
      where: { id: event.id, lockToken: event.lockToken },
      data: { status: 'PENDING', availableAt, lockedAt: null, lockToken: null },
    });
  }

  private async finishEvent(event: NotificationOutbox, status: string, reason?: string): Promise<void> {
    await this.prisma.notificationOutbox.updateMany({
      where: { id: event.id, lockToken: event.lockToken },
      data: { status, lastError: reason ?? null, completedAt: new Date(), lockedAt: null, lockToken: null },
    });
  }

  private toFcmData(value: Prisma.JsonValue | null): Record<string, string> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      typeof item === 'string' ? item : JSON.stringify(item),
    ]));
  }

  private firebaseErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
    return String((error as { code?: unknown }).code ?? '');
  }

  private safeError(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Unknown FCM delivery error';
    return message.replace(/token[=: ]+[^\\s,]+/gi, 'token=[redacted]').slice(0, 400);
  }
}
