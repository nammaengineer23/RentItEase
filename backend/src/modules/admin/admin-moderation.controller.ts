import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminModerationService } from './admin-moderation.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminModerationController {
  constructor(private readonly moderation: AdminModerationService) {}

  @Patch('reviews/:id')
  @ApiOperation({ summary: 'Update a review as admin' })
  updateReview(
    @Param('id') id: string,
    @Body() body: { rating?: number; comment?: string | null },
  ) {
    return this.moderation.updateReview(id, body);
  }

  @Patch('visits/:id/cancel')
  @ApiOperation({ summary: 'Cancel a property visit as admin' })
  cancelVisit(@Param('id') id: string) {
    return this.moderation.cancelVisit(id);
  }
}
