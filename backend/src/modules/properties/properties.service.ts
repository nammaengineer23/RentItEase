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
    if (!apiKey)
      throw new ServiceUnavailableException(
        'AI suggestions are not configured.',
      );
    const prompt = `Create a concise rental property title and an honest 2-sentence description. Return JSON only with title and description. Details: ${JSON.stringify(input)}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 180,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Unable to generate AI suggestion.',
      );
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content)
      throw new ServiceUnavailableException('AI returned no suggestion.');
    try {
      return JSON.parse(content.replace(/^```json\s*|\s*```$/g, ''));
    } catch {
      throw new ServiceUnavailableException('AI returned invalid suggestion.');
    }
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
              fullName: true,
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
        ...this.toPublicProperty(property),
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
        totalPages: Math.ceil(total / safeLimit),
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
            lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
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
                fullName: true,
              },
            },
          },
        }),

        // Latest Properties
        this.prisma.property.findMany({
          where: {
            lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
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
            lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
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
            lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
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
            lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
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
          ...this.toPublicProperty(property),
          averageRating:
          totalReviews: property.reviews.length,
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);

    return {
      success: true,

      featured: featured.map((p) => this.toPublicProperty(p)),

      latest: latest.map((p) => this.toPublicProperty(p)),

      mostFavorited: mostFavorited.map((p) => ({
        ...this.toPublicProperty(p),
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

    const latDelta = radius / 111;
    const lonDelta = radius / (111 * Math.max(0.01, Math.cos(this.toRadians(latitude))));

    const properties = await this.prisma.property.findMany({
      where: {
        lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
        isAvailable: true,
        isVerified: true,
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta,
        },
      },

      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
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
          ...this.toPublicProperty(property),
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
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
        isAvailable: true,
      },

      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
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

        socialMediaPosts: {
          where: {
            platform: 'YOUTUBE',
            status: 'PUBLISHED',
            externalId: { not: null },
          },
          select: {
            externalId: true,
            publishedAt: true,
          },
          orderBy: {
            publishedAt: 'desc',
          },
          take: 1,
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
        ...this.toPublicProperty(property),
        views: property.viewCount,
        totalViews: property.viewCount,
        averageRating,
        totalReviews,
        youtubeReelUrl: property.socialMediaPosts[0]?.externalId
          ? `https://www.youtube.com/watch?v=${property.socialMediaPosts[0].externalId}`
          : null,
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

        lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
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
            fullName: true,
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
        ...this.toPublicProperty(property),
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
      where: { id },
    });

    if (!property) throw new NotFoundException('Property not found.');

    const isOwner = property.ownerId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update this property.');
    }

    if ([PropertyLifecycleStatus.BOOKED, PropertyLifecycleStatus.OCCUPIED, PropertyLifecycleStatus.ARCHIVED].includes(property.lifecycleStatus)) {
      throw new BadRequestException('This property cannot be edited in its current lifecycle state.');
    }

    const { amenityIds, ...propertyData } = updatePropertyDto;

    if ((propertyData.latitude === undefined) !== (propertyData.longitude === undefined)) {
      throw new BadRequestException('Latitude and longitude must be supplied together.');
    }

    if (propertyData.dailyRentEnabled === true && propertyData.dailyRent === undefined && property.dailyRent === null) {
      throw new BadRequestException('Daily rent is required when daily rent is enabled.');
    }

    if (propertyData.dailyRentEnabled === false && propertyData.dailyRent !== undefined) {
      throw new BadRequestException('Daily rent cannot be supplied when daily rent is disabled.');
    }

    if (amenityIds !== undefined) {
      const amenities = await this.prisma.amenity.findMany({
        where: { id: { in: amenityIds } },
        select: { id: true },
      });
      if (amenities.length !== amenityIds.length) {
        throw new BadRequestException('One or more amenity IDs are invalid.');
      }
    }

    const data: Prisma.PropertyUpdateInput = {
      ...propertyData,
      ...(isOwner
        ? {
            lifecycleStatus: PropertyLifecycleStatus.SUBMITTED,
            isVerified: false,
            isAvailable: false,
          }
        : {}),
      amenities:
        amenityIds !== undefined
          ? {
              deleteMany: {},
              create: amenityIds.map((amenityId) => ({
                amenity: { connect: { id: amenityId } },
              })),
            }
          : undefined,
    };

    const updatedProperty = await this.prisma.property.update({
      where: { id },
      data,
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        amenities: { include: { amenity: true } },
        images: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return {
      success: true,
      message: isOwner
        ? 'Property updated and submitted for admin review.'
        : 'Property updated successfully.',
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
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found.');

    const userId = user.id ?? user.sub;
    const isOwner = property.ownerId === userId;
    const isAdmin = user.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update this property.');
    }

    if ([PropertyLifecycleStatus.BOOKED, PropertyLifecycleStatus.OCCUPIED, PropertyLifecycleStatus.ARCHIVED].includes(property.lifecycleStatus)) {
      throw new BadRequestException('Amenities cannot be changed in the current lifecycle state.');
    }

    const amenities = dto.amenityIds.length
      ? await this.prisma.amenity.findMany({
          where: { id: { in: dto.amenityIds } },
          select: { id: true },
        })
      : [];
    if (amenities.length !== dto.amenityIds.length) {
      throw new BadRequestException('One or more amenity IDs are invalid.');
    }

    const updatedProperty = await this.prisma.$transaction(async (tx) => {
      await tx.propertyAmenity.deleteMany({ where: { propertyId } });

      if (dto.amenityIds.length) {
        await tx.propertyAmenity.createMany({
          data: dto.amenityIds.map((amenityId) => ({ propertyId, amenityId })),
          skipDuplicates: true,
        });
      }

      return tx.property.update({
        where: { id: propertyId },
        data: isOwner
          ? {
              lifecycleStatus: PropertyLifecycleStatus.SUBMITTED,
              isVerified: false,
              isAvailable: false,
            }
          : {},
        include: { amenities: { include: { amenity: true } } },
      });
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

  async submit(id: string, user: { id: string; role: UserRole }) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found.');
    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the property owner can submit this listing.');
    }
    assertPropertyTransition(property.lifecycleStatus, PropertyLifecycleStatus.SUBMITTED);
    const updated = await this.prisma.property.update({
      where: { id },
      data: {
        lifecycleStatus: PropertyLifecycleStatus.SUBMITTED,
        isVerified: false,
        isAvailable: false,
      },
    });
    return { success: true, message: 'Property submitted for admin review.', property: serializePrisma(updated) };
  }

  async approve(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found.');
    if (property.lifecycleStatus !== PropertyLifecycleStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted properties can be approved.');
    }
    assertPropertyTransition(property.lifecycleStatus, PropertyLifecycleStatus.VERIFIED);
    const updated = await this.prisma.property.update({
      where: { id },
      data: {
        lifecycleStatus: PropertyLifecycleStatus.VERIFIED,
        isVerified: true,
        isAvailable: false,
      },
    });
    return { success: true, message: 'Property verified. Publish it to make it public.', property: serializePrisma(updated) };
  }

  async publish(id: string, user: { id: string; role: UserRole }) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found.');
    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the owner or admin can publish this property.');
    }
    if (property.lifecycleStatus !== PropertyLifecycleStatus.VERIFIED && property.lifecycleStatus !== PropertyLifecycleStatus.UNAVAILABLE) {
      throw new BadRequestException('Only verified or unavailable properties can be published.');
    }
    if (!property.isVerified) {
      throw new BadRequestException('Property must be admin verified before publishing.');
    }
    const updated = await this.prisma.property.update({
      where: { id },
      data: { lifecycleStatus: PropertyLifecycleStatus.PUBLISHED, isAvailable: true, isVerified: true },
    });
    return { success: true, message: 'Property published successfully.', property: serializePrisma(updated) };
  }

  async setUnavailable(id: string, user: { id: string; role: UserRole }) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found.');
    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the owner or admin can hide this property.');
    }
    if (![PropertyLifecycleStatus.PUBLISHED, PropertyLifecycleStatus.VERIFIED].includes(property.lifecycleStatus)) {
      throw new BadRequestException('Property cannot be hidden in its current lifecycle state.');
    }
    const updated = await this.prisma.property.update({
      where: { id },
      data: { lifecycleStatus: PropertyLifecycleStatus.UNAVAILABLE, isAvailable: false },
    });
    return { success: true, message: 'Property hidden from public listings.', property: serializePrisma(updated) };
  }

  async archive(id: string, user: { id: string; role: UserRole }) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        bookings: { where: { status: { in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'PAID'] } }, select: { id: true } },
        leases: { where: { status: 'ACTIVE' }, select: { id: true } },
      },
    });
    if (!property) throw new NotFoundException('Property not found.');
    if (property.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the owner or admin can archive this property.');
    }
    if (property.bookings.length || property.leases.length) {
      throw new BadRequestException('A property with an active booking or lease cannot be archived.');
    }
    if (property.lifecycleStatus === PropertyLifecycleStatus.ARCHIVED) {
      return { success: true, message: 'Property is already archived.', property: serializePrisma(property) };
    }
    assertPropertyTransition(property.lifecycleStatus, PropertyLifecycleStatus.ARCHIVED);
    const updated = await this.prisma.property.update({
      where: { id },
      data: { lifecycleStatus: PropertyLifecycleStatus.ARCHIVED, isAvailable: false, isVerified: false },
    });
    return { success: true, message: 'Property archived successfully.', property: serializePrisma(updated) };
  }

  private toPublicProperty<T extends Record<string, any>>(property: T): T {
    const serialized = serializePrisma(property) as T & {
      latitude?: string | number | null;
      longitude?: string | number | null;
    };

    if (serialized.latitude !== null && serialized.latitude !== undefined) {
      serialized.latitude = Number(Number(serialized.latitude).toFixed(3));
    }
    if (serialized.longitude !== null && serialized.longitude !== undefined) {
      serialized.longitude = Number(Number(serialized.longitude).toFixed(3));
    }

    return serialized as T;
  }

  // ===========================
  // Delete Property
  // ===========================

  async remove(id: string, user: any) {
    return this.archive(id, user);
  }
}
