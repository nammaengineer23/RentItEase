import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { promisify } from 'util';

import { PropertyImageSection, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ImageFileValidator } from '../../common/validators/image-file.validator';
import { ReorderImagesDto } from './dto/reorder-images.dto';

const execFileAsync = promisify(execFile);

@Injectable()
export class PropertyImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // =====================================
  // Upload Images
  // =====================================

  async uploadImages(
    propertyId: string,
    files: Express.Multer.File[],
    isPrimary: boolean,
    section: PropertyImageSection,
    user: any,
  ) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found.');
    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to upload images.');
    }
    if (!files?.length) throw new BadRequestException('No images uploaded.');
    if (files.length > 2) throw new BadRequestException('Maximum 2 images can be uploaded at a time.');

    const validator = new ImageFileValidator();
    for (const file of files) {
      if (!validator.isValid(file) || !(await validator.hasValidContent(file))) {
        throw new BadRequestException(validator.buildErrorMessage());
      }
    }

    const [currentSectionCount, currentCount] = await Promise.all([
      this.prisma.propertyImage.count({ where: { propertyId, section } }),
      this.prisma.propertyImage.count({ where: { propertyId } }),
    ]);
    if (currentSectionCount + files.length > 2) {
      throw new BadRequestException(`${section} can have a maximum of 2 images. Currently ${currentSectionCount} image(s) exist.`);
    }

    const uploaded: Array<{ publicId: string; imageUrl: string }> = [];
    try {
      // Upload objects first; only then atomically update the primary flag and metadata.
      for (const file of files) {
        uploaded.push(await this.storageService.uploadImage(file, 'properties'));
      }

      const images = await this.prisma.$transaction(async (tx) => {
        if (isPrimary) {
          await tx.propertyImage.updateMany({
            where: { propertyId, isPrimary: true },
            data: { isPrimary: false },
          });
        }
        const created = [];
        for (let index = 0; index < uploaded.length; index++) {
          created.push(await tx.propertyImage.create({
            data: {
              propertyId,
              imageUrl: uploaded[index].imageUrl,
              publicId: uploaded[index].publicId,
              displayOrder: currentCount + index,
              section,
              isPrimary: isPrimary && index === 0,
            },
          }));
        }
        return created;
      });

      return { success: true, message: 'Images uploaded successfully.', section, images };
    } catch (error) {
      await Promise.all(uploaded.map((item) =>
        this.storageService.deleteImage(item.publicId).catch(() => undefined),
      ));
      throw error;
    }
  }

  // =====================================
  // Property Video Tour
  // =====================================

  async uploadVideo(
    propertyId: string,
    file: Express.Multer.File,
    user: any,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You are not allowed to update this property video.',
      );
    }

    if (!file) {
      throw new BadRequestException('No video uploaded.');
    }

    const allowedMimeTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-m4v',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only MP4, MOV and M4V videos are allowed.',
      );
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new BadRequestException(
        'The property video must not exceed 100 MB.',
      );
    }
    if (property.videoPublicId && !property.videoPublicId.startsWith('property-videos/')) {
      throw new ConflictException('This video uses a legacy storage key. Complete the controlled storage migration before replacing it.');
    }

    // Verify the actual media container rather than trusting the client MIME type.
    await this.readVideoDurationSeconds(file);

    const uploaded = await this.storageService.uploadVideo(
      file,
      'property-videos',
    );

    let updated;
    try {
      updated = await this.prisma.property.update({
        where: { id: propertyId },
        data: {
          videoUrl: uploaded.imageUrl,
          videoPublicId: uploaded.publicId,
        },
        select: {
          id: true,
          videoUrl: true,
        },
      });
    } catch (error) {
      await this.storageService.deleteImage(uploaded.publicId).catch(() => {
        // Preserve the original database error.
      });
      throw error;
    }

    if (property.videoPublicId) {
      await this.storageService.deleteImage(property.videoPublicId).catch(() => {
        // The new video is already active; stale-object cleanup can be retried.
      });
    }

    return {
      success: true,
      message: property.videoUrl
        ? 'Property video replaced successfully.'
        : 'Property video uploaded successfully.',
      data: updated,
    };
  }

  async deleteVideo(propertyId: string, user: any) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You are not allowed to delete this property video.',
      );
    }

    // Clear the database reference first. If object deletion subsequently
    // fails, reconciliation can identify the now-unreferenced object; keeping
    // a DB reference to an already-deleted object would break media reads.
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { videoUrl: null, videoPublicId: null },
    });

    if (property.videoPublicId) {
      await this.storageService.deleteImage(property.videoPublicId).catch(() => {
        // Orphan cleanup is handled by the guarded storage reconciliation job.
      });
    }

    return {
      success: true,
      message: 'Property video deleted successfully.',
    };
  }

  // =====================================
  // Get Images
  // =====================================

  async getImages(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    const images = await this.prisma.propertyImage.findMany({
      where: {
        propertyId,
      },
      orderBy: [
        {
          section: 'asc',
        },
        {
          displayOrder: 'asc',
        },
      ],
    });

    return {
      success: true,
      images,
    };
  }

  // =====================================
  // Set Primary Image
  // =====================================

  async setPrimary(propertyId: string, imageId: string, user: any) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied.');
    }

    // IMPORTANT:
    // Verify the image belongs to this property.
    const image = await this.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found for this property.');
    }

    await this.prisma.$transaction([
      this.prisma.propertyImage.updateMany({
        where: {
          propertyId,
        },
        data: {
          isPrimary: false,
        },
      }),

      this.prisma.propertyImage.update({
        where: {
          id: imageId,
        },
        data: {
          isPrimary: true,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Primary image updated successfully.',
    };
  }

  // =====================================
  // Reorder Images
  // =====================================

  async reorderImages(propertyId: string, dto: ReorderImagesDto, user: any) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied.');
    }

    for (const image of dto.images) {
      const existing = await this.prisma.propertyImage.findFirst({
        where: {
          id: image.imageId,
          propertyId,
        },
      });

      if (!existing) {
        throw new NotFoundException(
          `Image ${image.imageId} does not belong to this property.`,
        );
      }
    }

    await this.prisma.$transaction(
      dto.images.map((image) =>
        this.prisma.propertyImage.update({
          where: {
            id: image.imageId,
          },
          data: {
            displayOrder: image.displayOrder,
          },
        }),
      ),
    );

    return {
      success: true,
      message: 'Images reordered successfully.',
    };
  }

  // =====================================
  // Delete Image
  // =====================================

  async deleteImage(propertyId: string, imageId: string, user: any) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied.');
    }

    const image = await this.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found for this property.');
    }

    // Delete the row and promote a replacement primary in one transaction.
    // If the transaction fails, keep the object and its metadata intact.
    await this.prisma.$transaction(async (tx) => {
      await tx.propertyImage.delete({
        where: { id: imageId },
      });

      if (image.isPrimary) {
        const nextImage = await tx.propertyImage.findFirst({
          where: { propertyId },
          orderBy: { displayOrder: 'asc' },
        });

        if (nextImage) {
          await tx.propertyImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    // Storage cleanup happens only after the DB transaction commits. A failed
    // delete leaves an unreferenced object for guarded reconciliation rather
    // than a database row pointing at an object that no longer exists.
    if (image.publicId) {
      await this.storageService.deleteImage(image.publicId).catch(() => {
        // Orphan cleanup is handled by the guarded storage reconciliation job.
      });
    }

    return {
      success: true,
      message: 'Image deleted successfully.',
    };
  }
  private async readVideoDurationSeconds(
    file: Express.Multer.File,
  ): Promise<number> {
    const workDir = await mkdtemp(join(tmpdir(), 'rentitease-video-'));
    const extension = extname(file.originalname).toLowerCase() || '.mp4';
    const inputPath = join(workDir, `upload${extension}`);

    try {
      await writeFile(inputPath, file.buffer);

      const ffprobePath = process.env.FFPROBE_PATH?.trim() || 'ffprobe';
      const { stdout } = await execFileAsync(
        ffprobePath,
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          inputPath,
        ],
        {
          timeout: 15_000,
          maxBuffer: 1024 * 1024,
        },
      );

      const duration = Number.parseFloat(stdout.trim());
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('ffprobe returned an invalid duration.');
      }

      return duration;
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        throw new InternalServerErrorException(
          'Video processing is temporarily unavailable. Please try again later.',
        );
      }

      if (error instanceof InternalServerErrorException) throw error;

      throw new BadRequestException(
        'Could not read this video. Please upload a valid MP4, MOV or M4V file.',
      );
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
