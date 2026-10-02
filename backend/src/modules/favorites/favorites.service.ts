import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ==========================
  // Add Favorite
  // ==========================

  async addFavorite(
    propertyId: string,
    user: any,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          isVerified: true,
          isAvailable: true,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    const existing =
      await this.prisma.favorite.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });

    if (existing) {
      throw new BadRequestException(
        'Property already added to favorites.',
      );
    }

  const favorite =
  await this.prisma.favorite.create({
    data: {
      userId: user.id,
      propertyId,
    },
  });

return {
  success: true,
  message: 'Property added to favorites.',
  favorite: serializePrisma(favorite),
};
  }

  // ==========================
  // Get My Favorites
  // ==========================

  async getMyFavorites(user: any) {
    const favorites =
      await this.prisma.favorite.findMany({
        where: {
          userId: user.id,
        },

        include: {
          property: {
            include: {
              owner: {
                select: {
                  id: true,
                },
              },

              images: {
                where: {
                  isPrimary: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return {
  success: true,
  total: favorites.length,
  favorites: serializePrisma(favorites),
};
  }

  // ==========================
  // Remove Favorite
  // ==========================

  async removeFavorite(
    propertyId: string,
    user: any,
  ) {
    const favorite =
      await this.prisma.favorite.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });

    if (!favorite) {
      throw new NotFoundException(
        'Favorite not found.',
      );
    }

    await this.prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return {
      success: true,
      message:
        'Property removed from favorites.',
    };
  }

  // ==========================
  // Check Favorite
  // ==========================

  async isFavorite(
    propertyId: string,
    user: any,
  ) {
    const favorite =
      await this.prisma.favorite.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });

    return {
      success: true,
      isFavorite: !!favorite,
    };
  }
}
