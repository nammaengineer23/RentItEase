import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PropertyImageSection, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ReorderImagesDto } from './dto/reorder-images.dto';

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

    const images = [];

    // ==========================================
    // Upload files
    // ==========================================

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      const uploadResult = await this.storageService.uploadImage(
        file,
        'properties',
      );

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

    return {
      success: true,
      message: 'Images uploaded successfully.',
      section,
      images,
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

    return {
      success: true,
      message: 'Image deleted successfully.',
    };
  }
}
