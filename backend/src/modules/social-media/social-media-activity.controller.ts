import { BadRequestException, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SocialPlatform, SocialPostStatus, UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin Social Media')
@ApiBearerAuth()
@Controller('admin/social-media/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SocialMediaActivityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('status') status?: SocialPostStatus, @Query('platform') platform?: SocialPlatform) {
    const where: { status?: SocialPostStatus; platform?: SocialPlatform } = {};
    if (status && Object.values(SocialPostStatus).includes(status)) where.status = status;
    if (platform && Object.values(SocialPlatform).includes(platform)) where.platform = platform;
    return serializePrisma(await this.prisma.socialMediaPost.findMany({
      where,
      include: {
        property: { select: { id: true, title: true, city: true, locality: true, owner: { select: { id: true, fullName: true } } } },
        consent: { select: { id: true, approved: true, consentVersion: true, consentedAt: true, revokedAt: true } },
        analyticsSnapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }));
  }

  @Post(':postId/cancel')
  async cancel(@Param('postId') postId: string, @Req() req: any) {
    const post = await this.prisma.socialMediaPost.findUnique({ where: { id: postId } });
    if (!post) throw new BadRequestException('Social post not found.');
    if (![SocialPostStatus.PENDING, SocialPostStatus.READY, SocialPostStatus.FAILED].includes(post.status)) {
      throw new BadRequestException(`A ${post.status.toLowerCase()} post cannot be cancelled.`);
    }
    const updated = await this.prisma.socialMediaPost.update({
      where: { id: postId },
      data: { status: SocialPostStatus.CANCELLED, scheduledAt: null, nextRetryAt: null },
    });
    await this.prisma.socialMediaAuditEvent.create({
      data: { propertyId: post.propertyId, postId, actorId: req.user.id, eventType: 'POST_CANCELLED', details: { previousStatus: post.status } },
    });
    return serializePrisma(updated);
  }

  @Get(':postId/history')
  async history(@Param('postId') postId: string) {
    return serializePrisma(await this.prisma.socialMediaAuditEvent.findMany({ where: { postId }, orderBy: { createdAt: 'desc' } }));
  }
}
