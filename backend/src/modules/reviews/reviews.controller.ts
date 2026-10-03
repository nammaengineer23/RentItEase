import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
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
import { ReviewPaginationDto } from './dto/review-pagination.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':propertyId')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add or update review' })
  @ApiParam({ name: 'propertyId' })
  create(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(propertyId, user.id, dto);
  }

  @Get(':propertyId')
  @ApiOperation({ summary: 'Get property reviews' })
  @ApiParam({ name: 'propertyId' })
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query() query: ReviewPaginationDto,
  ) {
    return this.reviewsService.findByProperty(propertyId, query.page, query.limit);
  }

  @Get(':propertyId/stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiParam({ name: 'propertyId' })
  getStats(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getStats(propertyId);
  }

  @Patch(':reviewId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review' })
  update(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(reviewId, user.id, dto);
  }

  @Delete(':reviewId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review' })
  remove(@Param('reviewId') reviewId: string, @CurrentUser() user: any) {
    return this.reviewsService.remove(reviewId, user.id);
  }
}
