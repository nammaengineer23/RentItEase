import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { MembershipStatus, Prisma, UserRole } from '@prisma/client';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertiesDto } from './dto/filter-property.dto';
import { UpdatePropertyAmenitiesDto } from './dto/update-property-amenities.dto';
import { NearbyPropertiesDto } from './dto/nearby-properties.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async suggestListingText(input: {
    propertyType?: string;
    city?: string;
    locality?: string;
    bedrooms?: number;
    furnishing?: string;
    rent?: number;
    amenities?: string[];
  }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('AI suggestions are not configured.');
    const prompt = `Create a concise rental property title and an honest 2-sentence description. Return JSON only with title and description. Details: ${JSON.stringify(input)}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.5, max_tokens: 180, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!response.ok) throw new ServiceUnavailableException('Unable to generate AI suggestion.');
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new ServiceUnavailableException('AI returned no suggestion.');
    try { return JSON.parse(content.replace(/^```json\s*|\s*```$/g, '')); } catch { throw new ServiceUnavailableException('AI returned invalid suggestion.'); }
  }

  // ===========================
  // Create Property
  // ===========================

  async create(createPropertyDto: CreatePropertyDto, user: any) {
    const { amenityIds, ...propertyData } = createPropertyDto;

    const property = await this.prisma.property.create({
      data: {
        ...propertyData,

        ownerId: user.id,
        isAvailable: false,
        isVerified: false,

        amenities: amenityIds?.length
          ? {
              create: amenityIds.map((amenityId) => ({
                amenity: {
                  connect: {
                    id: amenityId,
                  },
                },
              })),
            }
          : undefined,
      },

      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },

        amenities: {
          include: {
            amenity: true,
          },
        },

        reviews: true,

        images: true,
      },
    });

    return {
      success: true,
      message: 'Property created successfully.',
      property: serializePrisma(property),
    };
  }

  private buildPropertyWhere(
    filterDto: FilterPropertiesDto,
  ): Prisma.PropertyWhereInput {
    const {
      search,
      city,
      locality,
      pincode,
      propertyType,
      amenities,
      furnishing,
      bedrooms,
      bathrooms,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      parking,
      petFriendly,
      isAvailable,
      dailyRentEnabled,
      minDailyRent,
      maxDailyRent,
    } = filterDto;

    const where: Prisma.PropertyWhereInput = { isVerified: true };

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          city: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          locality: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (city) where.city = city;
    if (locality) where.locality = locality;
    if (pincode) where.pincode = pincode;
    if (propertyType) where.propertyType = propertyType;
    if (furnishing) where.furnishing = furnishing;
    if (bedrooms) where.bedrooms = bedrooms;
    if (bathrooms) where.bathrooms = bathrooms;
    if (parking !== undefined) where.parking = parking;
    if (petFriendly !== undefined) where.petFriendly = petFriendly;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;
    if (dailyRentEnabled !== undefined) {
      where.dailyRentEnabled = dailyRentEnabled;
    }

    if (minDailyRent || maxDailyRent) {
      where.dailyRent = {};
      if (minDailyRent) where.dailyRent.gte = minDailyRent;
      if (maxDailyRent) where.dailyRent.lte = maxDailyRent;
    }

    if (minPrice || maxPrice) {
      where.price = {};

      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    if (minArea || maxArea) {
      where.area = {};

      if (minArea) where.area.gte = minArea;
      if (maxArea) where.area.lte = maxArea;
    }

    if (amenities?.length) {
      where.amenities = {
        some: {
          amenityId: {
            in: amenities,
          },
        },
      };
    }

    return where;
  }

  // ===========================
  // Get All Properties
  // ===========================

  async findAll(filterDto: FilterPropertiesDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = filterDto;

    const where = this.buildPropertyWhere(filterDto);

    // -----------------------
    // Pagination
    // -----------------------

    const skip = (page - 1) * limit;

    const [properties, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,

        skip,

        take: limit,

        orderBy: {
          [sortBy]: order,
        },

        include: {
          owner: {
            select: {
              id: true,
            },
          },

          images: {
            orderBy: {
              displayOrder: 'asc',
            },
          },

          amenities: {
            include: {
              amenity: true,
            },
          },

          favorites: true,

          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.property.count({
        where,
      }),
    ]);

    // -----------------------
    // Average Rating
    // -----------------------

    const data = properties.map((property) => {
      const totalRating = property.reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );

      const averageRating =
        property.reviews.length > 0
          ? Number((totalRating / property.reviews.length).toFixed(1))
          : 0;

      return {
        ...serializePrisma(property),
        averageRating,
        totalReviews: property.reviews.length,
      };
    });

    return {
      success: true,

      data,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===========================
  // Home Screen
  // ===========================

  async home() {
    const [featured, latest, mostFavorited, topRated, popularLocalities] =
      await Promise.all([
        // Featured Properties
        this.prisma.property.findMany({
          where: {
            isAvailable: true,
            isVerified: true,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            images: {
              orderBy: {
                displayOrder: 'asc',
              },
              take: 1,
            },
            owner: {
              select: {
                id: true,
              },
            },
          },
        }),

        // Latest Properties
        this.prisma.property.findMany({
          where: {
            isAvailable: true,
            isVerified: true,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            images: {
              orderBy: {
                displayOrder: 'asc',
              },
              take: 1,
            },
          },
        }),

        // Most Favorited
        this.prisma.property.findMany({
          where: {
            isAvailable: true,
            isVerified: true,
          },
          take: 10,
          orderBy: {
            favorites: {
              _count: 'desc',
            },
          },
          include: {
            images: {
              take: 1,
            },
            _count: {
              select: {
                favorites: true,
              },
            },
          },
        }),

        // Top Rated
        this.prisma.property.findMany({
          where: {
            isAvailable: true,
            isVerified: true,
          },
          take: 10,
          include: {
            images: {
              take: 1,
            },
            reviews: true,
          },
        }),

        // Popular Localities
        this.prisma.property.groupBy({
          by: ['city', 'locality'],
          where: {
            isAvailable: true,
            isVerified: true,
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        }),
      ]);

    const topRatedProperties = topRated
      .map((property) => {
        const totalRating = property.reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        );

        const averageRating =
          property.reviews.length > 0
            ? Number((totalRating / property.reviews.length).toFixed(1))
            : 0;

        return {
          ...serializePrisma(property),
          averageRating,
          totalReviews: property.reviews.length,
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);

    return {
      success: true,

      featured: featured.map((p) => serializePrisma(p)),

      latest: latest.map((p) => serializePrisma(p)),

      mostFavorited: mostFavorited.map((p) => ({
        ...serializePrisma(p),
        favorites: p._count.favorites,
      })),

      topRated: topRatedProperties,

      popularLocalities,
    };
  }

  // ===========================
  // Owner - My Properties
  // ===========================

  async findMyProperties(user: any) {
    const properties = await this.prisma.property.findMany({
      where: {
        ownerId: user.id,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },

        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },

        amenities: {
          include: {
            amenity: true,
          },
        },

        favorites: true,

        reviews: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    const data = properties.map((property) => {
      const totalRating = property.reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );

      const averageRating =
        property.reviews.length > 0
          ? Number((totalRating / property.reviews.length).toFixed(1))
          : 0;

      return {
        ...serializePrisma(property),
        averageRating,
        totalReviews: property.reviews.length,
      };
    });

    return {
      success: true,
      total: data.length,
      data,
    };
  }

  /// ===========================
  // Nearby Properties
  // ===========================

  async findNearby(query: NearbyPropertiesDto) {
    const { latitude, longitude, radius = 5 } = query;

    const properties = await this.prisma.property.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        latitude: {
          not: null,
        },
        longitude: {
          not: null,
        },
      },

      include: {
        owner: {
          select: {
            id: true,
          },
        },

        images: {
          orderBy: {
            displayOrder: 'asc',
          },
          take: 1,
        },

        amenities: {
          include: {
            amenity: true,
          },
        },

        reviews: true,
      },
    });

    const nearby = properties
      .map((property) => {
        const lat = Number(property.latitude);
        const lng = Number(property.longitude);

        const distance = this.calculateDistance(latitude, longitude, lat, lng);

        return {
          ...serializePrisma(property),
          distance: Number(distance.toFixed(2)),
          averageRating:
            property.reviews.length === 0
              ? 0
              : Number(
                  (
                    property.reviews.reduce(
                      (sum, review) => sum + review.rating,
                      0,
                    ) / property.reviews.length
                  ).toFixed(1),
                ),
          totalReviews: property.reviews.length,
        };
      })
      .filter((property) => property.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return {
      success: true,
      total: nearby.length,
      radius,
      data: nearby,
    };
  }
  // ===========================
  // Get Property By Id
  // ===========================

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: {
        id,
      },

      include: {
        owner: {
          select: {
            id: true,
          },
        },

        amenities: {
          include: {
            amenity: true,
          },
        },

        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },

        reviews: {
          select: {
            rating: true,
          },
        },

        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    const totalReviews = property.reviews.length;
    const averageRating = totalReviews
      ? Number(
          (
            property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          ).toFixed(1),
        )
      : 0;

    return {
      success: true,
      property: {
        ...serializePrisma(property),
        views: property.viewCount,
        totalViews: property.viewCount,
        averageRating,
        totalReviews,
      },
    };
  }

  async getOwnerContact(id: string, user: { id: string; role: UserRole }) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        isVerified: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!property || (!property.isVerified && property.ownerId !== user.id)) {
      throw new NotFoundException('Property not found.');
    }

    const canViewWithoutMembership =
      user.role === UserRole.ADMIN || property.ownerId === user.id;

    if (!canViewWithoutMembership) {
      const now = new Date();
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: user.id,
          status: MembershipStatus.ACTIVE,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: { id: true },
      });

      if (!membership) {
        throw new ForbiddenException(
          'An active premium membership is required to view owner contact details.',
        );
      }
    }

    return {
      success: true,
      data: property.owner,
    };
  }

  async recordView(id: string, user: { id: string; role: UserRole }) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true, ownerId: true, viewCount: true },
    });
    if (!property) throw new NotFoundException('Property not found.');
    if (user.role !== UserRole.USER || property.ownerId === user.id) {
      return { views: property.viewCount, counted: false };
    }
    const updated = await this.prisma.property.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return { views: updated.viewCount, counted: true };
  }

  // ===========================
  // Similar Properties
  // ===========================

  async findSimilar(id: string) {
    const property = await this.prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    const similar = await this.prisma.property.findMany({
      where: {
        id: {
          not: id,
        },

        isAvailable: true,
        isVerified: true,

        city: property.city,

        propertyType: property.propertyType,

        OR: [
          {
            locality: property.locality,
          },
          {
            bedrooms: property.bedrooms,
          },
        ],
      },

      take: 10,

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        owner: {
          select: {
            id: true,
          },
        },

        images: {
          orderBy: {
            displayOrder: 'asc',
          },
          take: 1,
        },

        amenities: {
          include: {
            amenity: true,
          },
        },

        reviews: true,

        favorites: true,
      },
    });

    const data = similar.map((property) => {
      const totalRating = property.reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );

      const averageRating =
        property.reviews.length > 0
          ? Number((totalRating / property.reviews.length).toFixed(1))
          : 0;

      return {
        ...serializePrisma(property),
        averageRating,
        totalReviews: property.reviews.length,
        totalFavorites: property.favorites.length,
      };
    });

    return {
      success: true,
      total: data.length,
      data,
    };
  }

  // ===========================
  // Update Property
  // ===========================

  async update(id: string, updatePropertyDto: UpdatePropertyDto, user: any) {
    const property = await this.prisma.property.findUnique({
      where: {
        id,
      },

      include: {
        amenities: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You are not allowed to update this property.',
      );
    }

    const { amenityIds, ...propertyData } = updatePropertyDto;

    const updatedProperty = await this.prisma.property.update({
      where: {
        id,
      },

      data: {
        ...propertyData,

        amenities:
          amenityIds !== undefined
            ? {
                deleteMany: {},

                create: amenityIds.map((amenityId) => ({
                  amenity: {
                    connect: {
                      id: amenityId,
                    },
                  },
                })),
              }
            : undefined,
      },

      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },

        amenities: {
          include: {
            amenity: true,
          },
        },

        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    return {
      success: true,
      message: 'Property updated successfully.',
      property: serializePrisma(updatedProperty),
    };
  }

  // ===========================
  // Update Property Amenities
  // ===========================

  async updateAmenities(
    propertyId: string,
    dto: UpdatePropertyAmenitiesDto,
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

    const userId = user.id ?? user.sub;

    if (property.ownerId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this property.',
      );
    }

    await this.prisma.propertyAmenity.deleteMany({
      where: {
        propertyId,
      },
    });

    if (dto.amenityIds.length > 0) {
      await this.prisma.propertyAmenity.createMany({
        data: dto.amenityIds.map((amenityId) => ({
          propertyId,
          amenityId,
        })),
        skipDuplicates: true,
      });
    }

    const updatedProperty = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    return serializePrisma(updatedProperty);
  }

  // ===========================
  // Distance Calculator
  // ===========================

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  // ===========================
  // Delete Property
  // ===========================

  async remove(id: string, user: any) {
    const property = await this.prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You are not allowed to delete this property.',
      );
    }

    await this.prisma.property.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Property deleted successfully.',
    };
  }
}
