import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BookingStatus, LeaseStatus, MembershipStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { SocialMediaService } from '../social-media/social-media.service';
import { AdminAuditService, AdminAuditContext } from './admin-audit.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socialMediaService: SocialMediaService,
    private readonly audit: AdminAuditService,
  ) {}

  // ==========================
  // Dashboard
  // ==========================
  async getDashboard() {
    const [
      totalUsers,
      totalOwners,
      totalAdmins,
      totalProperties,
      activeProperties,
      totalReviews,
      totalFavorites,
      totalVisits,
      pendingVisits,
      approvedVisits,
      completedVisits,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.OWNER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { isAvailable: true } }),
      this.prisma.review.count(),
      this.prisma.favorite.count(),
      this.prisma.propertyVisit.count(),
      this.prisma.propertyVisit.count({ where: { status: 'PENDING' } }),
      this.prisma.propertyVisit.count({ where: { status: 'APPROVED' } }),
      this.prisma.propertyVisit.count({ where: { status: 'COMPLETED' } }),
    ]);

    return serializePrisma({
      users: { totalUsers, totalOwners, totalAdmins },
      properties: {
        totalProperties,
        activeProperties,
        rentedProperties: totalProperties - activeProperties,
      },
      engagement: { totalReviews, totalFavorites },
      visits: { totalVisits, pendingVisits, approvedVisits, completedVisits },
    });
  }

  // ==========================
  // Get All Users
  // ==========================
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return serializePrisma(users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      totalProperties: user._count.properties,
    })));
  }

  // ==========================
  // Get User Details
  // ==========================
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,

        properties: {
  select: {
    id: true,
    title: true,
    city: true,
    locality: true,
    price: true,
    isAvailable: true,
    createdAt: true,
  },
},

favorites: {
  select: {
    id: true,
    propertyId: true,
    createdAt: true,
  },
},

reviews: {
  select: {
    id: true,
    rating: true,
    comment: true,
    propertyId: true,
    createdAt: true,
  },
},

visits: {
  select: {
    id: true,
    propertyId: true,
    status: true,
    visitDate: true,
    createdAt: true,
  },
},
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    return serializePrisma({
      ...user,
      totalProperties: user.properties.length,
    });
  }

  private async assertAdminActor(actorId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor || actor.role !== UserRole.ADMIN || !actor.isActive) {
      throw new ForbiddenException('Active admin authorization is required.');
    }
    return actor;
  }

  async activateUser(id: string, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
    if (!user) throw new NotFoundException('User not found.');
    const updatedUser = await this.prisma.$transaction(
      async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data: { isActive: true },
          select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
        });
        await this.audit.recordTx(tx, context, 'USER_ACTIVATE', 'USER', id, user, updated);
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return serializePrisma(updatedUser);
  }

  async deactivateUser(id: string, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    if (id === actorId) throw new BadRequestException('Admins cannot deactivate their own account.');

    const result = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
        if (!user) throw new NotFoundException('User not found.');
        if (
          user.role === UserRole.ADMIN &&
          user.isActive &&
          (await tx.user.count({ where: { role: UserRole.ADMIN, isActive: true } })) <= 1
        ) {
          throw new BadRequestException('The last active admin cannot be deactivated.');
        }
        const updated = await tx.user.update({
          where: { id },
          data: { isActive: false },
          select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
        });
        await this.audit.recordTx(tx, context, 'USER_DEACTIVATE', 'USER', id, user, updated);
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return serializePrisma(result);
  }

  async updateUserRole(id: string, role: UserRole, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    if (!Object.values(UserRole).includes(role)) throw new BadRequestException('Invalid user role.');
    if (id === actorId) throw new BadRequestException('Admins cannot change their own role.');

    const result = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true, ownerRequestStatus: true } });
        if (!user) throw new NotFoundException('User not found.');
        if (
          user.role === UserRole.ADMIN &&
          role !== UserRole.ADMIN &&
          user.isActive &&
          (await tx.user.count({ where: { role: UserRole.ADMIN, isActive: true } })) <= 1
        ) {
          throw new BadRequestException('The last active admin cannot be demoted.');
        }
        const updated = await tx.user.update({
          where: { id },
          data: {
            role,
            ...(role === UserRole.OWNER
              ? { ownerRequestStatus: 'APPROVED', ownerReviewedAt: new Date() }
              : role === UserRole.USER
                ? { ownerReviewedAt: null }
                : {}),
          },
          select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
        });
        await this.audit.recordTx(tx, context, 'USER_ROLE_CHANGE', 'USER', id, user, updated);
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return serializePrisma(result);
  }

  async deleteUser(id: string, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    if (id === actorId) throw new BadRequestException('Admins cannot delete their own account.');

    const result = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id },
          select: { id: true, role: true, isActive: true, fullName: true, email: true },
        });
        if (!user) throw new NotFoundException('User not found.');
        if (
          user.role === UserRole.ADMIN &&
          user.isActive &&
          (await tx.user.count({ where: { role: UserRole.ADMIN, isActive: true } })) <= 1
        ) {
          throw new BadRequestException('The last active admin cannot be deleted.');
        }

        const [propertyCount, activeBookingCount, activeLeaseCount, activeMembershipCount] = await Promise.all([
          tx.property.count({ where: { ownerId: id } }),
          tx.booking.count({ where: { tenantId: id, status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.PAYMENT_PENDING, BookingStatus.PAID] } } }),
          tx.lease.count({ where: { tenantId: id, status: LeaseStatus.ACTIVE } }),
          tx.membership.count({ where: { userId: id, status: MembershipStatus.ACTIVE } }),
        ]);
        if (propertyCount || activeBookingCount || activeLeaseCount || activeMembershipCount) {
          throw new BadRequestException('User cannot be deleted while they own properties or have active rental, lease, or membership records. Deactivate the account instead.');
        }

        await tx.user.delete({ where: { id } });
        await this.audit.recordTx(tx, context, 'USER_DELETE', 'USER', id, user, null);
        return { success: true, message: 'User deleted successfully.' };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return result;
  }

    // ==========================
  // Get All Properties
  // ==========================
  async getProperties() {
    const properties = await this.prisma.property.findMany({
      select: {
        id: true,
        title: true,
        city: true,
        locality: true,
        price: true,
        isVerified: true,
        isAvailable: true,
        createdAt: true,
        owner: { select: { id: true, fullName: true, email: true } },
        images: {
          where: { isPrimary: true },
          orderBy: { displayOrder: 'asc' },
          take: 1,
          select: { imageUrl: true },
        },
        _count: {
          select: { favorites: true, visits: true, reviews: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return serializePrisma(properties.map((property) => ({
      id: property.id,
      title: property.title,
      city: property.city,
      locality: property.locality,
      price: Number(property.price),
      owner: property.owner,
      isVerified: property.isVerified,
      isAvailable: property.isAvailable,
      totalFavorites: property._count.favorites,
      totalVisits: property._count.visits,
      totalReviews: property._count.reviews,
      primaryImage: property.images[0]?.imageUrl ?? null,
      createdAt: property.createdAt,
    })));
  }

  // ==========================
  // Get Property Details
// ==========================
async getProperty(id: string) {
  const property = await this.prisma.property.findUnique({
    where: { id },

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          photoUrl: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      amenities: {
        include: {
          amenity: true,
        },
      },

      images: true,

      reviews: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              photoUrl: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },

      favorites: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              photoUrl: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },

      visits: {
        include: {
          tenant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              photoUrl: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    throw new NotFoundException(
      'Property not found.',
    );
  }

  return serializePrisma(property);
}

  // ==========================
  // Hide Property
  // ==========================
  async hideProperty(id: string, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    const updated = await this.prisma.property.update({
        where: { id },
        data: {
          isAvailable: false,
        },
      });
    await this.audit.record(context, 'PROPERTY_HIDE', 'PROPERTY', id, property, updated);
    return serializePrisma(updated);
  }

  // ==========================
  // Unhide Property
  // ==========================
  async unhideProperty(id: string, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    const [activeBookings, activeLeases] = await Promise.all([
      this.prisma.booking.count({
        where: {
          propertyId: id,
          status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.PAYMENT_PENDING, BookingStatus.PAID] },
        },
      }),
      this.prisma.lease.count({ where: { propertyId: id, status: LeaseStatus.ACTIVE } }),
    ]);
    if (activeBookings || activeLeases) {
      throw new BadRequestException('A property with an active booking or lease cannot be made available.');
    }
    const updated = await this.prisma.property.update({
      where: { id },
      data: { isAvailable: true },
    });
    await this.audit.record(context, 'PROPERTY_UNHIDE', 'PROPERTY', id, property, updated);
    return serializePrisma(updated);
  }

  async approveProperty(id: string, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found.');
    if (property.isVerified) throw new BadRequestException('Property is already approved.');

    const approved = await this.prisma.$transaction(
      async (tx) => {
        const updated = await tx.property.update({
          where: { id },
          data: {
            isVerified: true,
            isAvailable: true,
            lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
          },
        });
        const ownerBefore = await tx.user.findUnique({
          where: { id: property.ownerId },
          select: { id: true, role: true, ownerRequestStatus: true },
        });
        const ownerAfter = await tx.user.update({
          where: { id: property.ownerId },
          data: {
            role: UserRole.OWNER,
            ownerRequestStatus: 'APPROVED',
            ownerReviewedAt: new Date(),
          },
          select: { id: true, role: true, ownerRequestStatus: true },
        });
        await this.audit.recordTx(
          tx,
          context,
          'PROPERTY_APPROVE',
          'PROPERTY',
          id,
          { isVerified: property.isVerified, isAvailable: property.isAvailable },
          { isVerified: updated.isVerified, isAvailable: updated.isAvailable },
        );
        await this.audit.recordTx(
          tx,
          context,
          'USER_ROLE_PROMOTION',
          'USER',
          property.ownerId,
          ownerBefore,
          ownerAfter,
        );
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Prepare marketing content only after the approval transaction commits.
    // Generation must never block or roll back property approval; the admin can
    // regenerate from Social Media if preparation fails.
    void this.socialMediaService.onPropertyApproved(id).catch((error) => {
      console.error('Automatic reel preparation failed after property approval', {
        propertyId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return serializePrisma(approved);
  }

  // ==========================
  // Delete Property
  // ==========================
  async deleteProperty(id: string, actorId: string, context: AdminAuditContext) {
    await this.assertAdminActor(actorId);
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    const [activeBookings, activeLeases] = await Promise.all([
      this.prisma.booking.count({ where: { propertyId: id, status: { in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'PAID'] } } }),
      this.prisma.lease.count({ where: { propertyId: id, status: 'ACTIVE' } }),
    ]);
    if (activeBookings || activeLeases) {
      throw new BadRequestException('Property cannot be deleted while it has an active booking or lease.');
    }
    await this.prisma.property.delete({ where: { id } });
    await this.audit.record(context, 'PROPERTY_DELETE', 'PROPERTY', id, property, null);
    return { success: true, message: 'Property deleted successfully.' };
  }

  // ==========================
// Get All Reviews
// ==========================
async getReviews() {
  const reviews = await this.prisma.review.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          locality: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return serializePrisma(reviews);
}

// ==========================
// Delete Review
// ==========================
async deleteReview(id: string, actorId: string, context: AdminAuditContext) {
  await this.assertAdminActor(actorId);
  const review = await this.prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new NotFoundException('Review not found.');
  }

  await this.prisma.review.delete({ where: { id } });
  await this.audit.record(context, 'REVIEW_DELETE', 'REVIEW', id, review, null);
  return { success: true, message: 'Review deleted successfully.' };
}

// ==========================
// Get All Visits
// ==========================
async getVisits() {
  const visits = await this.prisma.propertyVisit.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          locality: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return serializePrisma(visits);
}

// ==========================
// Approve Visit
// ==========================
async approveVisit(id: string) {
  const visit = await this.prisma.propertyVisit.findUnique({
    where: { id },
  });

  if (!visit) {
    throw new NotFoundException('Visit not found.');
  }

  return serializePrisma(
    await this.prisma.propertyVisit.update({
      where: { id },
      data: {
        status: 'APPROVED',
      },
    }),
  );
}

// ==========================
// Reject Visit
// ==========================
async rejectVisit(id: string) {
  const visit = await this.prisma.propertyVisit.findUnique({
    where: { id },
  });

  if (!visit) {
    throw new NotFoundException('Visit not found.');
  }

  return serializePrisma(
    await this.prisma.propertyVisit.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    }),
  );
}

// ==========================
// Complete Visit
// ==========================
async completeVisit(id: string) {
  const visit = await this.prisma.propertyVisit.findUnique({
    where: { id },
  });

  if (!visit) {
    throw new NotFoundException('Visit not found.');
  }

  return serializePrisma(
    await this.prisma.propertyVisit.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    }),
  );
}
// ==========================
// Platform Analytics
// ==========================
async getAnalytics() {
    const [
      totalUsers,
      owners,
      tenants,
      admins,
      activeUsers,
      totalProperties,
      availableProperties,
      reviews,
      favorites,
      visits,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.OWNER } }),
      this.prisma.user.count({ where: { role: UserRole.USER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { isAvailable: true } }),
      this.prisma.review.count(),
      this.prisma.favorite.count(),
      this.prisma.propertyVisit.count(),
    ]);

    return serializePrisma({
      users: {
        total: totalUsers,
        owners,
        tenants,
        admins,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      properties: {
        total: totalProperties,
        available: availableProperties,
        rented: totalProperties - availableProperties,
      },
      engagement: {
        reviews,
        favorites,
        visits,
      },
    });
  }
}
