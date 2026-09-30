import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  // ==========================
  // Create / Update Review
  // ==========================

  @Post(':propertyId')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add or update review',
  })
  @ApiParam({
    name: 'propertyId',
  })
  create(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      propertyId,
      user.id,
      dto,
    );
  }

  // ==========================
  // Get Reviews
  // ==========================

  @Get(':propertyId')
  @ApiOperation({
    summary: 'Get property reviews',
  })
  @ApiParam({
    name: 'propertyId',
  })
  findByProperty(
    @Param('propertyId') propertyId: string,
  ) {
    return this.reviewsService.findByProperty(
      propertyId,
    );
  }

  // ==========================
  // Review Statistics
  // ==========================

  @Get(':propertyId/stats')
  @ApiOperation({
    summary: 'Get review statistics',
  })
  @ApiParam({
    name: 'propertyId',
  })
  getStats(
    @Param('propertyId') propertyId: string,
  ) {
    return this.reviewsService.getStats(
      propertyId,
    );
  }

  // ==========================
  // Update Review
  // ==========================

  @Patch(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update review',
  })
  update(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(
      reviewId,
      user.id,
      dto,
    );
  }

  // ==========================
  // Delete Review
  // ==========================

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete review',
  })
  remove(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.remove(
      reviewId,
      user.id,
    );
  }
}