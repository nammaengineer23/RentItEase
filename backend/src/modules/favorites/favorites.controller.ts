import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':propertyId')
  @ApiOperation({ summary: 'Add property to favorites' })
  addFavorite(@Param('propertyId') propertyId: string, @Request() req: any) {
    return this.favoritesService.addFavorite(propertyId, req.user);
  }

  // Keep this static route before /:propertyId so it cannot be captured as a property id.
  @Get('check/:propertyId')
  @ApiOperation({ summary: 'Check if property is favorited' })
  isFavorite(@Param('propertyId') propertyId: string, @Request() req: any) {
    return this.favoritesService.isFavorite(propertyId, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get my favorite properties' })
  getMyFavorites(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoritesService.getMyFavorites(
      req.user,
      page === undefined ? undefined : Number(page),
      limit === undefined ? undefined : Number(limit),
    );
  }

  @Delete(':propertyId')
  @ApiOperation({ summary: 'Remove property from favorites' })
  removeFavorite(@Param('propertyId') propertyId: string, @Request() req: any) {
    return this.favoritesService.removeFavorite(propertyId, req.user);
  }
}
