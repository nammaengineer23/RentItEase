import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

  @Post('properties/:propertyId/use-property-video')
  usePropertyVideo(
    @Param('propertyId') propertyId: string,
    @Body() body: { title?: string; caption?: string },
    @Req() req: any,
  ) {
    return this.service.usePropertyVideo(propertyId, req.user.id, body);
  }

  @Post('properties/:propertyId/upload-reel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowed = ['video/mp4', 'video/quicktime', 'video/x-m4v'].includes(file.mimetype);
        callback(allowed ? null : new Error('Only MP4, MOV and M4V videos are allowed.'), allowed);
      },
    }),
  )
  uploadPreparedReel(
    @Param('propertyId') propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; caption?: string },
    @Req() req: any,
  ) {
    return this.service.uploadPreparedReel(propertyId, req.user.id, file, body);
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
