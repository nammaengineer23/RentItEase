import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { SocialSettingsDto } from './dto/social-settings.dto';
import { SocialMediaService } from './social-media.service';

@Controller('admin/social-media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SocialMediaController {
  constructor(private readonly service: SocialMediaService) {}

  @Get('settings')
  getSettings() {
    return this.service.settings();
  }

  @Get('properties')
  getProperties() {
    return this.service.listProperties();
  }

  @Get('analytics')
  getAnalytics() {
    return this.service.analytics();
  }

  @Post('settings')
  updateSettings(@Body() dto: SocialSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Post('generate')
  generate(@Body() dto: GenerateVideoDto) {
    return this.service.generate(dto);
  }

  @Post('properties/:propertyId/publish')
  publish(
    @Param('propertyId') propertyId: string,
    @Body() dto: PublishPostDto,
    @Req() req: any,
  ) {
    return this.service.publish({ ...dto, propertyId, actorId: req.user.id });
  }

  @Post('properties/:propertyId/schedule')
  schedule(
    @Param('propertyId') propertyId: string,
    @Body() dto: PublishPostDto & { scheduledAt: string },
    @Req() req: any,
  ) {
    return this.service.schedule({
      ...dto,
      propertyId,
      actorId: req.user.id,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Post('posts/:postId/retry')
  retry(@Param('postId') postId: string, @Req() req: any) {
    return this.service.retry(postId, req.user.id);
  }

  @Post('posts/:postId/analytics')
  recordAnalytics(
    @Param('postId') postId: string,
    @Body() metrics: { impressions?: number; clicks?: number; likes?: number; shares?: number; leads?: number },
    @Req() req: any,
  ) {
    return this.service.recordAnalytics(postId, req.user.id, metrics);
  }

  @Post('process-due')
  processDue() {
    return this.service.processDuePosts();
  }

  @Post('properties/:propertyId/approved')
  processApproved(@Param('propertyId') propertyId: string) {
    return this.service.onPropertyApproved(propertyId);
  }
}
