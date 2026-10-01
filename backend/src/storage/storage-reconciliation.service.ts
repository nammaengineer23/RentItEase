import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from './storage.service';

export interface ReconciliationResult {
  driver: string;
  graceHours: number;
  dryRun: boolean;
  scanned: number;
  referenced: number;
  orphaned: number;
  deleted: number;
  failed: number;
  candidates: string[];
}

@Injectable()
export class StorageReconciliationService {
  private readonly logger = new Logger(StorageReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async reconcile(options?: {
    dryRun?: boolean;
    graceHours?: number;
  }): Promise<ReconciliationResult> {
    const dryRun = options?.dryRun ?? true;
    const graceHours = Math.min(
      Math.max(Math.floor(options?.graceHours ?? 24), 1),
      168,
    );
    const cutoff = Date.now() - graceHours * 60 * 60 * 1000;

    const referenced = new Set<string>();
    const [images, properties, messages] = await Promise.all([
      this.prisma.propertyImage.findMany({
        where: { publicId: { not: null } },
        select: { publicId: true },
      }),
      this.prisma.property.findMany({
        where: { videoPublicId: { not: null } },
        select: { videoPublicId: true },
      }),
      this.prisma.message.findMany({
        where: { attachmentPublicId: { not: null } },
        select: { attachmentPublicId: true },
      }),
    ]);

    for (const row of images) {
      if (row.publicId) referenced.add(this.normalize(row.publicId));
    }
    for (const row of properties) {
      if (row.videoPublicId) referenced.add(this.normalize(row.videoPublicId));
    }
    for (const row of messages) {
      if (row.attachmentPublicId) {
        referenced.add(this.normalize(row.attachmentPublicId));
      }
    }

    const objects = await this.storageService.listObjects();
    const candidates = objects
      .filter((object) => object.createdAt.getTime() <= cutoff)
      .filter((object) => !referenced.has(this.normalize(object.publicId)));

    let deleted = 0;
    let failed = 0;

    if (!dryRun) {
      for (const object of candidates) {
        try {
          await this.storageService.deleteImage(object.publicId);
          deleted++;
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to delete orphaned storage object ${object.publicId}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    }

    return {
      driver: this.storageService.driverName,
      graceHours,
      dryRun,
      scanned: objects.length,
      referenced: referenced.size,
      orphaned: candidates.length,
      deleted,
      failed,
      candidates: candidates.map((object) => object.publicId),
    };
  }

  private normalize(publicId: string): string {
    return publicId.startsWith('r2:') ? publicId.slice(3) : publicId;
  }
}
