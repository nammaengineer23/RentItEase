import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CreatePremiumListingDto } from './dto/create-premium-listing.dto';
import { UpdatePremiumListingDto } from './dto/update-premium-listing.dto';
import { PremiumListingsService } from './premium-listings.service';
import { PromotePropertyDto } from './dto/promote-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('premium-listings')
export class PremiumListingsController {
  constructor(
    private readonly premiumListingsService: PremiumListingsService,
  ) {}

  @Post('me')
  @UseGuards(JwtAuthGuard)
  promoteMyProperty(
    @Request() req: any,
    @Body() dto: PromotePropertyDto,
  ) {
    return this.premiumListingsService.promoteIncluded(
      req.user.id,
      dto.propertyId,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyListings(@Request() req: any) {
    return this.premiumListingsService.findByUser(req.user.id);
  }

  @Post('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Param('userId') userId: string,
    @Body() dto: CreatePremiumListingDto,
  ) {
    return this.premiumListingsService.create(
      userId,
      dto,
    );
  }

  @Get('active')
  getActiveListings() {
    return this.premiumListingsService.getActiveListings();
  }

  @Get('property/:propertyId')
  getByProperty(
    @Param('propertyId') propertyId: string,
  ) {
    return this.premiumListingsService.findByProperty(
      propertyId,
    );
  }

  @Get('property/:propertyId/status')
  getPropertyStatus(
    @Param('propertyId') propertyId: string,
  ) {
    return this.premiumListingsService.isPropertyPremium(
      propertyId,
    );
  }

  @Get('property/:propertyId/active')
  getActiveByProperty(
    @Param('propertyId') propertyId: string,
  ) {
    return this.premiumListingsService.getActiveByProperty(
      propertyId,
    );
  }

  @Get('users/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.premiumListingsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.premiumListingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePremiumListingDto,
  ) {
    return this.premiumListingsService.update(
      id,
      dto,
    );
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  activate(@Param('id') id: string) {
    return this.premiumListingsService.activate(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  cancel(@Param('id') id: string) {
    return this.premiumListingsService.cancel(id);
  }

  @Patch(':id/expire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  expire(@Param('id') id: string) {
    return this.premiumListingsService.expire(id);
  }

  @Post('expire-due')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  expireDueListings() {
    return this.premiumListingsService.expireDueListings();
  }
}
