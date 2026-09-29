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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
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
  @UseGuards(JwtAuthGuard)
  create(
    @Param('userId') userId: string,
    @Body() dto: CreatePremiumListingDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role !== UserRole.ADMIN && user.id !== userId) {
      throw new ForbiddenException('You can only create premium listings for your own account.');
    }
    return this.premiumListingsService.create(userId, dto);
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
  @UseGuards(JwtAuthGuard)
  getByUser(@Param('userId') userId: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.premiumListingsService.findByUser(userId, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.premiumListingsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePremiumListingDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.premiumListingsService.update(id, dto, user);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  activate(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.premiumListingsService.activate(id, user);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.premiumListingsService.cancel(id, user);
  }

  @Patch(':id/expire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  expire(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.premiumListingsService.expire(id, user);
  }

  @Post('expire-due')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  expireDueListings() {
    return this.premiumListingsService.expireDueListings();
  }
}
