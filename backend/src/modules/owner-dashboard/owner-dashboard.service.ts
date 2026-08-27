import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OwnerDashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ==========================
  // Dashboard Summary
  // ==========================
  async getDashboard(ownerId: string) {
    const properties = await this.prisma.property.findMany({
      where: {
        ownerId,
      },
      include: {
        favorites: true,
        visits: true,
        reviews: true,
      },
    });

    const totalProperties = properties.length;

    const availableProperties = properties.filter(
      (p) => p.isAvailable,
    ).length;

    const rentedProperties =
      totalProperties - availableProperties;

    const totalFavorites = properties.reduce(
      (sum, property) => sum + property.favorites.length,
      0,
    );

    const totalVisits = properties.reduce(
      (sum, property) => sum + property.visits.length,
      0,
    );

    const pendingVisits = properties.reduce(
      (sum, property) =>
        sum +
        property.visits.filter(
          (v) => v.status === 'PENDING',
        ).length,
      0,
    );

    const completedVisits = properties.reduce(
      (sum, property) =>
        sum +
        property.visits.filter(
          (v) => v.status === 'COMPLETED',
        ).length,
      0,
    );

    const allReviews = properties.flatMap(
      (property) => property.reviews,
    );

    const totalReviews = allReviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : Number(
            (
              allReviews.reduce(
                (sum, review) => sum + review.rating,
                0,
              ) / totalReviews
            ).toFixed(1),
          );

    return {
      totalProperties,
      availableProperties,
      rentedProperties,
      totalFavorites,
      totalVisits,
      pendingVisits,
      completedVisits,
      averageRating,
      totalReviews,
    };
  }

  // ==========================
  // Owner Activity Feed
  // ==========================
  async getActivity(ownerId: string) {
    const properties = await this.prisma.property.findMany({
      where: {
        ownerId,
      },
      include: {
        visits: {
          include: {
            tenant: true,
          },
        },
        reviews: {
          include: {
            user: true,
          },
        },
        favorites: {
          include: {
            user: true,
          },
        },
      },
    });

    const activities: any[] = [];

    for (const property of properties) {
      for (const visit of property.visits) {
        activities.push({
          type: 'VISIT',
          title: `${visit.tenant.fullName} requested a property visit`,
          property: property.title,
          status: visit.status,
          createdAt: visit.createdAt,
        });
      }

      for (const review of property.reviews) {
        activities.push({
          type: 'REVIEW',
          title: `${review.user.fullName} rated ${review.rating}★`,
          property: property.title,
          status: 'COMPLETED',
          createdAt: review.createdAt,
        });
      }

      for (const favorite of property.favorites) {
        activities.push({
          type: 'FAVORITE',
          title: `${favorite.user.fullName} added your property to favorites`,
          property: property.title,
          status: 'ACTIVE',
          createdAt: favorite.createdAt,
        });
      }
    }

    return activities
      .sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime(),
      )
      .slice(0, 10);
  }

  // ==========================
  // Owner Properties
  // ==========================
  async getMyProperties(ownerId: string) {
    const properties = await this.prisma.property.findMany({
      where: {
        ownerId,
      },
      include: {
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

    return properties.map((property) => {
      const pendingVisits = property.visits.filter(
        (visit) => visit.status === 'PENDING',
      ).length;

      const completedVisits = property.visits.filter(
        (visit) => visit.status === 'COMPLETED',
      ).length;

      const totalReviews = property.reviews.length;

      const averageRating =
        totalReviews === 0
          ? 0
          : Number(
              (
                property.reviews.reduce(
                  (sum, review) => sum + review.rating,
                  0,
                ) / totalReviews
              ).toFixed(1),
            );

      return {
        id: property.id,
        title: property.title,
        city: property.city,
        locality: property.locality,
        price: Number(property.price),
        isAvailable: property.isAvailable,
        averageRating,
        totalReviews,
        totalFavorites: property.favorites.length,
        pendingVisits,
        completedVisits,
        primaryImage:
          property.images.length > 0
            ? property.images[0].imageUrl
            : null,
        createdAt: property.createdAt,
      };
    });
  }

  // ==========================
  // Owner Analytics
  // ==========================
  async getAnalytics(ownerId: string) {
    const summary = await this.getDashboard(ownerId);

    const properties = await this.prisma.property.findMany({
      where: {
        ownerId,
      },
      include: {
        visits: true,
        favorites: true,
        reviews: true,
      },
    });

    const monthlyVisits = Array(12).fill(0);
    const monthlyFavorites = Array(12).fill(0);
    const monthlyReviews = Array(12).fill(0);

    for (const property of properties) {
      property.visits.forEach((visit) => {
        monthlyVisits[
          new Date(visit.createdAt).getMonth()
        ]++;
      });

      property.favorites.forEach((favorite) => {
        monthlyFavorites[
          new Date(favorite.createdAt).getMonth()
        ]++;
      });

      property.reviews.forEach((review) => {
        monthlyReviews[
          new Date(review.createdAt).getMonth()
        ]++;
      });
    }

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return {
      summary,

      monthlyVisits: months.map((month, index) => ({
        month,
        count: monthlyVisits[index],
      })),

      monthlyFavorites: months.map(
        (month, index) => ({
          month,
          count: monthlyFavorites[index],
        }),
      ),

      monthlyReviews: months.map(
        (month, index) => ({
          month,
          count: monthlyReviews[index],
        }),
      ),
    };
  }
}
