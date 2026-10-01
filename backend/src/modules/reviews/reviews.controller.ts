import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ReviewStatus, UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review after a completed visit or rental' })
  @ApiParam({ name: 'propertyId' })
  create(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(propertyId, user.id, dto);
  }

  // Keep admin/static routes before parameter routes so they cannot be
  // shadowed by /:propertyId during framework route registration.
  @Get('admin/moderation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending reviews for moderation' })
  getModerationQueue() {
    return this.reviewsService.getModerationQueue();
  }

  @Patch('admin/:reviewId/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a review' })
  moderate(
    @Param('reviewId') reviewId: string,
    @Body('status') status: ReviewStatus,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.moderate(reviewId, status, user.role);
  }

  @Get(':propertyId')
  @ApiOperation({ summary: 'Get approved property reviews' })
  @ApiParam({ name: 'propertyId' })
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.findByProperty(
      propertyId,
      Number(page ?? 1),
      Number(limit ?? 20),
    );
  }

  @Get(':propertyId/stats')
  @ApiOperation({ summary: 'Get approved property review statistics' })
  @ApiParam({ name: 'propertyId' })
  getStats(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getStats(propertyId);
  }

  @Patch(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit your review within the edit window' })
  update(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(reviewId, user.id, dto);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your review' })
  remove(@Param('reviewId') reviewId: string, @CurrentUser() user: any) {
    return this.reviewsService.remove(reviewId, user.id);
  }
}
