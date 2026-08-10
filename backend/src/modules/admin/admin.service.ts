import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ==========================
  // Dashboard
  // ==========================
  async getDashboard() {
    const [
      users,
      properties,
      reviews,
      favorites,
      visits,
    ] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.property.findMany(),
      this.prisma.review.findMany(),
      this.prisma.favorite.findMany(),
      this.prisma.propertyVisit.findMany(),
    ]);

    const totalUsers = users.length;

    const totalOwners = users.filter(
      (u) => u.role === 'OWNER',
    ).length;

    const totalAdmins = users.filter(
      (u) => u.role === 'ADMIN',
    ).length;

    const totalProperties = properties.length;

    const activeProperties = properties.filter(
      (p) => p.isAvailable,
    ).length;

    const rentedProperties =
      totalProperties - activeProperties;

    const pendingVisits = visits.filter(
      (v) => v.status === 'PENDING',
    ).length;

    const approvedVisits = visits.filter(
      (v) => v.status === 'APPROVED',
    ).length;

    const completedVisits = visits.filter(
      (v) => v.status === 'COMPLETED',
    ).length;

    return serializePrisma({
      users: {
        totalUsers,
        totalOwners,
        totalAdmins,
      },

      properties: {
        totalProperties,
        activeProperties,
        rentedProperties,
      },

      engagement: {
        totalReviews: reviews.length,
        totalFavorites: favorites.length,
      },

      visits: {
        totalVisits: visits.length,
        pendingVisits,
        approvedVisits,
        completedVisits,
      },
    });
  }

  // ==========================
  // Get All Users
  // ==========================
  async getUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        properties: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return serializePrisma(
      users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        totalProperties: user.properties.length,
      })),
    );
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

  // ==========================
  // Activate User
  // ==========================
  // ==========================
// Activate User
// ==========================
async activateUser(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found.');
  }

  const updatedUser = await this.prisma.user.update({
    where: { id },
    data: {
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return serializePrisma(updatedUser);
}
  // ==========================
// Deactivate User
// ==========================
async deactivateUser(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found.');
  }

  const updatedUser = await this.prisma.user.update({
    where: { id },
    data: {
      isActive: false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return serializePrisma(updatedUser);
}
  // ==========================
  // Delete User
  // ==========================
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message:
        'User deleted successfully.',
    };
  }
    // ==========================
  // Get All Properties
  // ==========================
  async getProperties() {
    const properties = await this.prisma.property.findMany({
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        favorites: true,
        visits: true,
        reviews: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return serializePrisma(
      properties.map((property) => ({
        id: property.id,
        title: property.title,
        city: property.city,
        locality: property.locality,
        price: Number(property.price),
        owner: property.owner,
        isAvailable: property.isAvailable,
        totalFavorites: property.favorites.length,
        totalVisits: property.visits.length,
        totalReviews: property.reviews.length,
        primaryImage:
          property.images.length > 0
            ? property.images[0].imageUrl
            : null,
        createdAt: property.createdAt,
      })),
    );
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
  async hideProperty(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    return serializePrisma(
      await this.prisma.property.update({
        where: { id },
        data: {
          isAvailable: false,
        },
      }),
    );
  }

  // ==========================
  // Unhide Property
  // ==========================
  async unhideProperty(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    return serializePrisma(
      await this.prisma.property.update({
        where: { id },
        data: {
          isAvailable: true,
        },
      }),
    );
  }

  // ==========================
  // Delete Property
  // ==========================
  async deleteProperty(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found.',
      );
    }

    await this.prisma.property.delete({
      where: { id },
    });

    return {
      success: true,
      message:
        'Property deleted successfully.',
    };
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
async deleteReview(id: string) {
  const review = await this.prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new NotFoundException('Review not found.');
  }

  await this.prisma.review.delete({
    where: { id },
  });

  return {
    success: true,
    message: 'Review deleted successfully.',
  };
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
    users,
    properties,
    reviews,
    favorites,
    visits,
  ] = await Promise.all([
    this.prisma.user.findMany(),
    this.prisma.property.findMany(),
    this.prisma.review.findMany(),
    this.prisma.favorite.findMany(),
    this.prisma.propertyVisit.findMany(),
  ]);

  return serializePrisma({
    users: {
      total: users.length,
      owners: users.filter(u => u.role === 'OWNER').length,
      tenants: users.filter(u => u.role === 'USER').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
    },

    properties: {
      total: properties.length,
      available: properties.filter(p => p.isAvailable).length,
      rented: properties.filter(p => !p.isAvailable).length,
    },

    engagement: {
      reviews: reviews.length,
      favorites: favorites.length,
      visits: visits.length,
    },
  });
}
}