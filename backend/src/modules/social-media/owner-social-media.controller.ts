import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerMarketingConsentDto } from './dto/owner-marketing-consent.dto';
import { SocialMediaService } from './social-media.service';

@Controller('social-media/owner')
@UseGuards(JwtAuthGuard)
export class OwnerSocialMediaController {
  constructor(private readonly service: SocialMediaService) {}

  @Post('consent')
  saveConsent(@Req() req: any, @Body() dto: OwnerMarketingConsentDto) {
    return this.service.saveOwnerConsent({
      ...dto,
      ownerId: req.user.id,
    });
  }

  @Get('consent/:propertyId')
  getConsent(@Req() req: any, @Param('propertyId') propertyId: string) {
    return this.service.getOwnerConsent(propertyId, req.user.id);
  }
}
