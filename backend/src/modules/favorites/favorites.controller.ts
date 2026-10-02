import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { FavoritesService } from './favorites.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
  ) {}

  // ==========================
  // Add Favorite
  // ==========================

  @Post(':propertyId')
  @ApiOperation({
    summary: 'Add property to favorites',
  })
  addFavorite(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    return this.favoritesService.addFavorite(
      propertyId,
      req.user,
    );
  }

  // ==========================
  // Get My Favorites
  // ==========================

  @Get()
  @ApiOperation({
    summary: 'Get my favorite properties',
  })
  getMyFavorites(
    @Request() req: any,
  ) {
    return this.favoritesService.getMyFavorites(
      req.user,
    );
  }

  // ==========================
  // Remove Favorite
  // ==========================

  @Delete(':propertyId')
  @ApiOperation({
    summary: 'Remove property from favorites',
  })
  removeFavorite(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    return this.favoritesService.removeFavorite(
      propertyId,
      req.user,
    );
  }

  // ==========================
  // Check Favorite
  // ==========================

  @Get('check/:propertyId')
  @ApiOperation({
    summary: 'Check if property is favorited',
  })
  isFavorite(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    return this.favoritesService.isFavorite(
      propertyId,
      req.user,
    );
  }
}