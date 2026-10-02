import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipStatus,
  PremiumListingStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreatePremiumListingDto } from './dto/create-premium-listing.dto';
import { UpdatePremiumListingDto } from './dto/update-premium-listing.dto';

@Injectable()
export class PremiumListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async promoteIncluded(userId: string, propertyId: string) {
    const now = new Date();
    await this.expireDueListings();

    const [property, membership, existing] = await Promise.all([
      this.prisma.property.findUnique({ where: { id: propertyId } }),
      this.prisma.membership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
          OR: [{ endDate: null }, { endDate: { gt: now } }],
          plan: { code: 'PREMIUM' },
        },
        include: { plan: true },
        orderBy: { endDate: 'desc' },
      }),
      this.prisma.premiumListing.findFirst({
        where: { propertyId, status: PremiumListingStatus.ACTIVE },
        include: { property: true, membership: { include: { plan: true } } },
      }),
    ]);

    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== userId) {
      throw new BadRequestException('You can only promote your own property');
    }
    if (!membership) {
      throw new BadRequestException(
        'An active Premium membership is required to promote a property',
      );
    }
    if (existing) return existing;

    const membershipEnd = membership.endDate;
    const endDate = membershipEnd ?? new Date(now.getTime());
    if (!membershipEnd) {
      endDate.setDate(endDate.getDate() + membership.plan.durationDays);
    }
    const durationDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000),
    );

    return this.prisma.premiumListing.create({
      data: {
        propertyId,
        userId,
        membershipId: membership.id,
        membershipPlanId: membership.planId,
        status: PremiumListingStatus.ACTIVE,
        startDate: now,
        endDate,
        activatedAt: now,
        durationDays,
        amount: new Prisma.Decimal(0),
        currency: 'INR',
      },
      include: { property: true, membership: { include: { plan: true } } },
    });
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    userId: string,
    dto: CreatePremiumListingDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new BadRequestException(
        'You can only promote your own property',
      );
    }

    const activeMembership =
      await this.prisma.membership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
        include: {
          plan: true,
        },
        orderBy: {
          endDate: 'desc',
        },
      });

    if (!activeMembership) {
      throw new BadRequestException(
        'An active membership is required for premium listing',
      );
    }

    const existingActive =
      await this.prisma.premiumListing.findFirst({
        where: {
          propertyId: dto.propertyId,
          status: PremiumListingStatus.ACTIVE,
        },
      });

    if (existingActive) {
      throw new BadRequestException(
        'This property already has an active premium listing',
      );
    }

    const durationDays =
      dto.durationDays ?? activeMembership.plan.durationDays;

    return this.prisma.premiumListing.create({
      data: {
        propertyId: dto.propertyId,
        userId,
        membershipId: activeMembership.id,
        membershipPlanId: activeMembership.planId,
        status: PremiumListingStatus.PENDING,
        durationDays,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? 'INR',
      },
      include: {
        property: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  // ============================================================
  // GET
  // ============================================================

  async findOne(id: string) {
    const listing =
      await this.prisma.premiumListing.findUnique({
        where: { id },
        include: {
          property: true,
          membership: {
            include: {
              plan: true,
            },
          },
        },
      });

    if (!listing) {
      throw new NotFoundException(
        'Premium listing not found',
      );
    }

    return listing;
  }

  async findByUser(userId: string) {
    return this.prisma.premiumListing.findMany({
      where: { userId },
      include: {
        property: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByProperty(propertyId: string) {
    return this.prisma.premiumListing.findMany({
      where: { propertyId },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getActiveByProperty(propertyId: string) {
    return this.prisma.premiumListing.findFirst({
      where: {
        propertyId,
        status: PremiumListingStatus.ACTIVE,
      },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    });
  }

  async getActiveListings() {
    return this.prisma.premiumListing.findMany({
      where: {
        status: PremiumListingStatus.ACTIVE,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        property: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdatePremiumListingDto,
  ) {
    await this.findOne(id);

    return this.prisma.premiumListing.update({
      where: { id },
      data: {
        ...(dto.durationDays !== undefined && {
          durationDays: dto.durationDays,
        }),
        ...(dto.amount !== undefined && {
          amount: new Prisma.Decimal(dto.amount),
        }),
        ...(dto.currency !== undefined && {
          currency: dto.currency,
        }),
      },
      include: {
        property: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  // ============================================================
  // ACTIVATE
  // ============================================================

  async activate(id: string) {
    const listing = await this.findOne(id);

    if (listing.status === PremiumListingStatus.ACTIVE) {
      throw new BadRequestException(
        'Premium listing is already active',
      );
    }

    if (listing.status === PremiumListingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled premium listing cannot be activated',
      );
    }

    const membership = listing.membership;

    if (!membership) {
      throw new BadRequestException(
        'Premium listing requires a membership',
      );
    }

    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException(
        'The membership associated with this listing is not active',
      );
    }

    if (membership.endDate && membership.endDate <= new Date()) {
      throw new BadRequestException(
        'The membership associated with this listing has expired',
      );
    }

    const existingActive =
      await this.prisma.premiumListing.findFirst({
        where: {
          propertyId: listing.propertyId,
          status: PremiumListingStatus.ACTIVE,
          NOT: {
            id,
          },
        },
      });

    if (existingActive) {
      throw new BadRequestException(
        'This property already has another active premium listing',
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    endDate.setDate(
      endDate.getDate() + listing.durationDays,
    );

    if (membership.endDate && endDate > membership.endDate) {
      endDate.setTime(membership.endDate.getTime());
    }

    return this.prisma.premiumListing.update({
      where: { id },
      data: {
        status: PremiumListingStatus.ACTIVE,
        startDate,
        endDate,
        activatedAt: startDate,
        expiredAt: null,
        cancelledAt: null,
      },
      include: {
        property: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async cancel(id: string) {
    const listing = await this.findOne(id);

    if (listing.status === PremiumListingStatus.CANCELLED) {
      throw new BadRequestException(
        'Premium listing is already cancelled',
      );
    }

    if (listing.status === PremiumListingStatus.EXPIRED) {
      throw new BadRequestException(
        'Expired premium listing cannot be cancelled',
      );
    }

    return this.prisma.premiumListing.update({
      where: { id },
      data: {
        status: PremiumListingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        property: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  // ============================================================
  // EXPIRY
  // ============================================================

  async expire(id: string) {
    const listing = await this.findOne(id);

    if (listing.status !== PremiumListingStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active premium listings can be expired',
      );
    }

    return this.prisma.premiumListing.update({
      where: { id },
      data: {
        status: PremiumListingStatus.EXPIRED,
        expiredAt: new Date(),
      },
      include: {
        property: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async expireDueListings() {
    const now = new Date();

    const result =
      await this.prisma.premiumListing.updateMany({
        where: {
          status: PremiumListingStatus.ACTIVE,
          endDate: {
            lte: now,
          },
        },
        data: {
          status: PremiumListingStatus.EXPIRED,
          expiredAt: now,
        },
      });

    return {
      expiredCount: result.count,
      processedAt: now,
    };
  }

  // ============================================================
  // STATUS
  // ============================================================

  async isPropertyPremium(propertyId: string) {
    const listing =
      await this.prisma.premiumListing.findFirst({
        where: {
          propertyId,
          status: PremiumListingStatus.ACTIVE,
          endDate: {
            gt: new Date(),
          },
        },
      });

    return {
      propertyId,
      isPremium: !!listing,
      listingId: listing?.id ?? null,
      endDate: listing?.endDate ?? null,
    };
  }
}
