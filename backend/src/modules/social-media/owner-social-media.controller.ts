import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerMarketingConsentDto } from './dto/owner-marketing-consent.dto';
import { SocialMediaService } from './social-media.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('social-media/owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
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
