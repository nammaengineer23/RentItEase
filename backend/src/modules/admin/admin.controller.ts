import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  ) {}

  @Get('dashboard')
  getDashboard() { return this.adminService.getDashboard(); }

  @Get('users')
  getUsers() { return this.adminService.getUsers(); }

  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string) { return this.adminService.activateUser(id); }

  @Patch('users/:id/deactivate')
  deactivateUser(@Param('id') id: string) { return this.adminService.deactivateUser(id); }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) { return this.adminService.deleteUser(id); }

  @Get('properties')
  getProperties() { return this.adminService.getProperties(); }

  @Get('properties/:id')
  getProperty(@Param('id') id: string) { return this.adminService.getProperty(id); }

  @Patch('properties/:id/hide')
  hideProperty(@Param('id') id: string) { return this.adminService.hideProperty(id); }

  @Patch('properties/:id/unhide')
  unhideProperty(@Param('id') id: string) { return this.adminService.unhideProperty(id); }

  @Patch('properties/:id/approve')
  approveProperty(@Param('id') id: string) { return this.adminService.approveProperty(id); }

  @Delete('properties/:id')
  deleteProperty(@Param('id') id: string) { return this.adminService.deleteProperty(id); }

  @Get('users/:id')
  getUser(@Param('id') id: string) { return this.adminService.getUser(id); }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews' })
  getReviews() { return this.adminService.getReviews(); }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review' })
  deleteReview(@Param('id') id: string) { return this.adminService.deleteReview(id); }

  @Get('visits')
  @ApiOperation({ summary: 'Get all property visits with owner and booking context' })
  getVisits() { return this.moderation.listVisits(); }

  @Patch('visits/:id/approve')
  @ApiOperation({ summary: 'Approve a pending property visit' })
  approveVisit(@Param('id') id: string) { return this.moderation.transitionVisit(id, 'approve'); }

  @Patch('visits/:id/reject')
  @ApiOperation({ summary: 'Reject a pending property visit' })
  rejectVisit(@Param('id') id: string) { return this.moderation.transitionVisit(id, 'reject'); }

  @Patch('visits/:id/complete')
  @ApiOperation({ summary: 'Complete an approved property visit' })
  completeVisit(@Param('id') id: string) { return this.moderation.transitionVisit(id, 'complete'); }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  getAnalytics() { return this.adminService.getAnalytics(); }
}
