import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { SocialSettingsDto } from './dto/social-settings.dto';
import { SocialMediaService } from './social-media.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin/social-media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SocialMediaController {
  constructor(private readonly service: SocialMediaService) {}

  @Get('settings')
  getSettings() {
    return this.service.settings();
  }

  @Post('settings')
  updateSettings(@Body() dto: SocialSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Post('generate')
  generate(@Body() dto: GenerateVideoDto) {
    return this.service.generate(dto);
  }

  @Get('properties')
  getConsentedProperties() {
    return this.service.getConsentedProperties();
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
