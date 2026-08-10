import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreatePremiumListingDto } from './dto/create-premium-listing.dto';
import { UpdatePremiumListingDto } from './dto/update-premium-listing.dto';
import { PremiumListingsService } from './premium-listings.service';

@Controller('premium-listings')
export class PremiumListingsController {
  constructor(
    private readonly premiumListingsService: PremiumListingsService,
  ) {}

  @Post('users/:userId')
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
  activate(@Param('id') id: string) {
    return this.premiumListingsService.activate(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.premiumListingsService.cancel(id);
  }

  @Patch(':id/expire')
  expire(@Param('id') id: string) {
    return this.premiumListingsService.expire(id);
  }

  @Post('expire-due')
  expireDueListings() {
    return this.premiumListingsService.expireDueListings();
  }
}
