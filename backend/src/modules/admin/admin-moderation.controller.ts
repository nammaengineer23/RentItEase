import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PropertyDocumentReviewStatus, UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuditService } from './admin-audit.service';
import { AdminModerationService } from './admin-moderation.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminModerationController {
  constructor(
    private readonly moderation: AdminModerationService,
    private readonly audit: AdminAuditService,
  ) {}

  private context(request: any, reason?: string) {
    return {
      adminId: request.user.id,
      ipAddress: request.ip ?? request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ?? null,
      device: request.headers?.['user-agent'] ?? null,
      reason: reason?.trim() || null,
    };
  }


  @Get('properties/document-review')
  @ApiOperation({ summary: 'List properties awaiting document review' })
  listPropertiesForDocumentReview() {
    return this.moderation.listPropertiesForDocumentReview();
  }

  @Patch('properties/:id/document-review')
  @ApiOperation({ summary: 'Set property document review status (does not verify/publish the property)' })
  updatePropertyDocumentReview(
    @Param('id') id: string,
    @Body() body: { status: PropertyDocumentReviewStatus; reason?: string },
    @Req() request: any,
  ) {
    return this.moderation.updatePropertyDocumentReview(
      id,
      body.status,
      this.context(request, body.reason),
    );
  }

  @Patch('reviews/:id')
  @ApiOperation({ summary: 'Update a review as admin' })
  updateReview(
    @Param('id') id: string,
    @Body() body: { rating?: number; comment?: string | null; reason?: string },
    @Req() request: any,
  ) {
    return this.moderation.updateReview(id, body, this.context(request, body.reason));
  }

  @Patch('visits/:id/cancel')
  @ApiOperation({ summary: 'Cancel a property visit as admin' })
  cancelVisit(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.moderation.cancelVisit(id, this.context(request, body?.reason));
  }
}
