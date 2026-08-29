import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { SocialSettingsDto } from './dto/social-settings.dto';
import { SocialMediaService } from './social-media.service';

@Controller('admin/social-media')
@UseGuards(JwtAuthGuard)
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
  ) {
    return this.service.publish({ ...dto, propertyId });
  }

  @Post('properties/:propertyId/approved')
  processApproved(@Param('propertyId') propertyId: string) {
    return this.service.onPropertyApproved(propertyId);
  }
}
