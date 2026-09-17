import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSearchController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Search admin records across users, properties, reviews, visits, memberships, invoices and social posts' })
  async search(@Query('q') rawQuery = '', @Query('limit') rawLimit = '5') {
    const query = rawQuery.trim();
    if (query.length < 2) return { query, results: [] };
    const limit = Math.min(Math.max(Number.parseInt(rawLimit, 10) || 5, 1), 10);
    const contains = { contains: query, mode: 'insensitive' as const };

    const [users, properties, reviews, visits, memberships, invoices, socialPosts] = await Promise.all([
      this.prisma.user.findMany({
        where: { OR: [{ id: contains }, { fullName: contains }, { email: contains }, { phone: contains }] },
        select: { id: true, fullName: true, email: true, phone: true, role: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.findMany({
        where: { OR: [{ id: contains }, { title: contains }, { address: contains }, { city: contains }, { locality: contains }, { owner: { is: { OR: [{ fullName: contains }, { email: contains }] } } }] },
        select: { id: true, title: true, city: true, locality: true, isVerified: true, owner: { select: { fullName: true, email: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.findMany({
        where: { OR: [{ id: contains }, { comment: contains }, { user: { is: { OR: [{ fullName: contains }, { email: contains }] } } }, { property: { is: { title: contains } } }] },
        select: { id: true, rating: true, comment: true, user: { select: { fullName: true } }, property: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.propertyVisit.findMany({
        where: { OR: [{ id: contains }, { notes: contains }, { tenant: { is: { OR: [{ fullName: contains }, { email: contains }] } } }, { property: { is: { title: contains } } }] },
        select: { id: true, status: true, visitDate: true, tenant: { select: { fullName: true, email: true } }, property: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.membership.findMany({
        where: { OR: [{ id: contains }, { notes: contains }, { razorpayOrderId: contains }, { razorpayPaymentId: contains }, { user: { is: { OR: [{ fullName: contains }, { email: contains }] } } }, { plan: { is: { OR: [{ name: contains }, { code: { equals: query.toUpperCase() as any } }] } } }] },
        select: { id: true, status: true, isTrial: true, user: { select: { fullName: true, email: true } }, plan: { select: { name: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.findMany({
        where: { OR: [{ id: contains }, { invoiceNumber: contains }, { description: contains }, { user: { is: { OR: [{ fullName: contains }, { email: contains }] } } }] },
        select: { id: true, invoiceNumber: true, status: true, totalAmount: true, user: { select: { fullName: true, email: true } } },
        take: limit,
        orderBy: { invoiceDate: 'desc' },
      }),
      this.prisma.socialMediaPost.findMany({
        where: { OR: [{ id: contains }, { caption: contains }, { externalId: contains }, { property: { is: { title: contains } } }] },
        select: { id: true, platform: true, status: true, caption: true, property: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      query,
      results: [
        ...users.map((item) => ({ type: 'USER', id: item.id, title: item.fullName, subtitle: `${item.email} • ${item.role}`, path: '/users' })),
        ...properties.map((item) => ({ type: 'PROPERTY', id: item.id, title: item.title, subtitle: `${item.locality ?? item.city} • ${item.owner.fullName}`, path: '/properties' })),
        ...reviews.map((item) => ({ type: 'REVIEW', id: item.id, title: `${item.rating}★ • ${item.property.title}`, subtitle: `${item.user.fullName}${item.comment ? ` • ${item.comment}` : ''}`, path: '/reviews' })),
        ...visits.map((item) => ({ type: 'VISIT', id: item.id, title: item.property.title, subtitle: `${item.tenant.fullName} • ${item.status}`, path: '/visits' })),
        ...memberships.map((item) => ({ type: 'MEMBERSHIP', id: item.id, title: `${item.user.fullName} • ${item.plan.name}`, subtitle: `${item.status}${item.isTrial ? ' • Trial' : ''}`, path: '/premium-memberships' })),
        ...invoices.map((item) => ({ type: 'INVOICE', id: item.id, title: item.invoiceNumber, subtitle: `${item.user.fullName} • ${item.status} • INR ${item.totalAmount}`, path: '/billing' })),
        ...socialPosts.map((item) => ({ type: 'SOCIAL_POST', id: item.id, title: `${item.platform} • ${item.property.title}`, subtitle: `${item.status}${item.caption ? ` • ${item.caption}` : ''}`, path: '/social-media' })),
      ].slice(0, limit * 7),
    };
  }
}
