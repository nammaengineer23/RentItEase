import {
  BadRequestException,
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

import { PropertyImageSection, PropertyLifecycleStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { FileScanService } from '../../storage/file-scan.service';
import { StorageService } from '../../storage/storage.service';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import {
  validateImageContent,
  validateVideoContent,
} from '../../common/validators/upload-content.validator';

const execFileAsync = promisify(execFile);

@Injectable()
export class PropertyImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly fileScanService: FileScanService,
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
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to upload images.');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No images uploaded.');
    }

    if (files.length > 2) {
      throw new BadRequestException(
        'Maximum 2 images can be uploaded at a time.',
      );
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Each image must not exceed 5 MB.');
      }
      await validateImageContent(file);
    }

    // ==========================================
    // Maximum 2 images per section
    // ==========================================

    const currentSectionCount = await this.prisma.propertyImage.count({
      where: {
        propertyId,
        section,
      },
    });

    if (currentSectionCount + files.length > 2) {
      throw new BadRequestException(
        `${section} can have a maximum of 2 images. ` +
          `Currently ${currentSectionCount} image(s) exist.`,
      );
    }

    // ==========================================
    // Current total image count
    // ==========================================

    const currentCount = await this.prisma.propertyImage.count({
      where: {
        propertyId,
      },
    });

    // ==========================================
    // Primary image handling
    // ==========================================

    // If this upload is marked primary, make sure
    // the property has only one primary image.
    if (isPrimary) {
      await this.prisma.propertyImage.updateMany({
        where: {
          propertyId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const uploadedObjects: string[] = [];
    const images = [];

    try {
      for (let index = 0; index < files.length; index++) {
        await validateImageUpload(files[index]);
        await this.fileScanService.scan(files[index]);

        const uploadResult = await this.storageService.uploadImage(
          files[index],
          'properties',
        );
        uploadedObjects.push(uploadResult.publicId);

        const image = await this.prisma.propertyImage.create({
          data: {
            propertyId,
            imageUrl: uploadResult.imageUrl,
            publicId: uploadResult.publicId,
            displayOrder: currentCount + index,
            section,
            isPrimary: isPrimary && index === 0,
          },
        });

        images.push(image);
      }
    } catch (error) {
      await Promise.all(
        uploadedObjects.map((publicId) =>
          this.storageService.deleteImage(publicId).catch(() => undefined),
        ),
      );
      throw error;
    }

    if (user.role !== UserRole.ADMIN) {
      await this.markOwnerMediaChanged(propertyId, user.id);
    }

    return {
      success: true,
      message: 'Images uploaded successfully.',
      section,
      images,
    };
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

    await validateVideoContent(file);

    if (file.size > 100 * 1024 * 1024) {
      throw new BadRequestException(
        'The property video must not exceed 100 MB.',
      );
    }

    const durationSeconds = await this.readVideoDurationSeconds(file);
    if (durationSeconds > 60) {
      throw new BadRequestException('The property video must not exceed 60 seconds.');
    }

    this.assertMediaMutationAllowed(property, user);

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

    if (user.role !== UserRole.ADMIN) {
      await this.markOwnerMediaChanged(propertyId, user.id);
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
    this.assertMediaMutationAllowed(property, user);

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        videoUrl: null,
        videoPublicId: null,
      },
    });

    if (property.videoPublicId) {
      await this.storageService.deleteImage(property.videoPublicId);
    }
    if (user.role !== UserRole.ADMIN) {
      await this.markOwnerMediaChanged(propertyId, user.id);
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
        lifecycleStatus: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }
    if (property.lifecycleStatus !== PropertyLifecycleStatus.PUBLISHED) {
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
    this.assertMediaMutationAllowed(property, user);

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

    if (user.role !== UserRole.ADMIN) {
      await this.markOwnerMediaChanged(propertyId, user.id);
    }

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
    this.assertMediaMutationAllowed(property, user);

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

    if (user.role !== UserRole.ADMIN) {
      await this.markOwnerMediaChanged(propertyId, user.id);
    }

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
    this.assertMediaMutationAllowed(property, user);

    const image = await this.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found for this property.');
    }

    // Delete the object from R2 or legacy Firebase Storage.
    if (image.publicId) {
      await this.storageService.deleteImage(image.publicId);
    }

    // Delete image from database.
    await this.prisma.propertyImage.delete({
      where: {
        id: imageId,
      },
    });

    // If deleted image was primary,
    // assign the first remaining image.
    if (image.isPrimary) {
      const nextImage = await this.prisma.propertyImage.findFirst({
        where: {
          propertyId,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });

      if (nextImage) {
        await this.prisma.propertyImage.update({
          where: {
            id: nextImage.id,
          },
          data: {
            isPrimary: true,
          },
        });
      }
    }

    if (user.role !== UserRole.ADMIN) {
      await this.markOwnerMediaChanged(propertyId, user.id);
    }

    return {
      success: true,
      message: 'Image deleted successfully.',
    };
  }
  private assertMediaMutationAllowed(property: any, user: any) {
    if ([PropertyLifecycleStatus.BOOKED, PropertyLifecycleStatus.OCCUPIED, PropertyLifecycleStatus.ARCHIVED].includes(property.lifecycleStatus)) {
      throw new BadRequestException('Property media cannot be changed in the current lifecycle state.');
    }
    if (user.role === UserRole.ADMIN) return;
  }

  private async markOwnerMediaChanged(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true, lifecycleStatus: true },
    });
    if (!property || property.ownerId !== userId) return;

    if (property.lifecycleStatus === PropertyLifecycleStatus.DRAFT) return;

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        lifecycleStatus: PropertyLifecycleStatus.SUBMITTED,
        isVerified: false,
        isAvailable: false,
      },
    });
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
