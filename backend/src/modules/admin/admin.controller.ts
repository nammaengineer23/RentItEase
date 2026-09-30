import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuditService } from './admin-audit.service';
import { AdminModerationService } from './admin-moderation.service';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
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

  @Get('dashboard')
  getDashboard() { return this.adminService.getDashboard(); }

  @Get('users')
  getUsers() { return this.adminService.getUsers(); }

  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.activateUser(id, request.user.id, this.context(request, body?.reason));
  }

  @Patch('users/:id/deactivate')
  deactivateUser(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.deactivateUser(id, request.user.id, this.context(request, body?.reason));
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role: UserRole; reason?: string }, @Req() request: any) {
    return this.adminService.updateUserRole(id, body.role, request.user.id, this.context(request, body.reason));
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.deleteUser(id, request.user.id, this.context(request, body?.reason));
  }

  @Get('properties')
  getProperties() { return this.adminService.getProperties(); }

  @Get('properties/:id')
  getProperty(@Param('id') id: string) { return this.adminService.getProperty(id); }

  @Patch('properties/:id/hide')
  hideProperty(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.hideProperty(id, request.user.id, this.context(request, body?.reason));
  }

  @Patch('properties/:id/unhide')
  unhideProperty(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.unhideProperty(id, request.user.id, this.context(request, body?.reason));
  }

  @Patch('properties/:id/approve')
  approveProperty(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.approveProperty(id, request.user.id, this.context(request, body?.reason));
  }

  @Delete('properties/:id')
  deleteProperty(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.deleteProperty(id, request.user.id, this.context(request, body?.reason));
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) { return this.adminService.getUser(id); }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews' })
  getReviews() { return this.adminService.getReviews(); }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review' })
  deleteReview(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.adminService.deleteReview(id, request.user.id, this.context(request, body?.reason));
  }

  @Get('visits')
  @ApiOperation({ summary: 'Get all property visits with owner and booking context' })
  getVisits() { return this.moderation.listVisits(); }

  @Patch('visits/:id/approve')
  @ApiOperation({ summary: 'Approve a pending property visit' })
  approveVisit(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.moderation.transitionVisit(id, 'approve', this.context(request, body?.reason));
  }

  @Patch('visits/:id/reject')
  @ApiOperation({ summary: 'Reject a pending property visit' })
  rejectVisit(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.moderation.transitionVisit(id, 'reject', this.context(request, body?.reason));
  }

  @Patch('visits/:id/complete')
  @ApiOperation({ summary: 'Complete an approved property visit' })
  completeVisit(@Param('id') id: string, @Req() request: any, @Body() body: { reason?: string }) {
    return this.moderation.transitionVisit(id, 'complete', this.context(request, body?.reason));
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get recent admin audit records' })
  getAudit(@Req() request: any) {
    return this.audit.list(request.query?.limit);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  getAnalytics() { return this.adminService.getAnalytics(); }
}
