import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(propertyId: string, user: any) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, isVerified: true, isAvailable: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    try {
      const favorite = await this.prisma.favorite.upsert({
        where: { userId_propertyId: { userId: user.id, propertyId } },
        create: { userId: user.id, propertyId },
        update: {},
      });

      return {
        success: true,
        message: 'Property added to favorites.',
        favorite: serializePrisma(favorite),
      };
    } catch (error) {
      // The composite unique constraint remains the final concurrency guard.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const favorite = await this.prisma.favorite.findUnique({
          where: { userId_propertyId: { userId: user.id, propertyId } },
        });
        if (favorite) {
          return {
            success: true,
            message: 'Property already in favorites.',
            favorite: serializePrisma(favorite),
          };
        }
      }
      throw error;
    }
  }

  async getMyFavorites(user: any, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT) {
    const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
    const normalizedLimit = Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), MAX_LIMIT)
      : DEFAULT_LIMIT;
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [favorites, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where: { userId: user.id },
        include: {
          property: {
            include: {
              owner: { select: { id: true } },
              images: { where: { isPrimary: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: normalizedLimit,
      }),
      this.prisma.favorite.count({ where: { userId: user.id } }),
    ]);

    return {
      success: true,
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
      favorites: serializePrisma(favorites),
    };
  }

  async removeFavorite(propertyId: string, user: any) {
    const deleted = await this.prisma.favorite.deleteMany({
      where: { userId: user.id, propertyId },
    });

    return {
      success: true,
      removed: deleted.count > 0,
      message: deleted.count > 0
        ? 'Property removed from favorites.'
        : 'Property was not in favorites.',
    };
  }

  async isFavorite(propertyId: string, user: any) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: user.id, propertyId } },
    });

    return { success: true, isFavorite: !!favorite };
  }
}
