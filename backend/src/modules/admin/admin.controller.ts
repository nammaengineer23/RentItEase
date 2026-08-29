import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';

import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminService } from './admin.service';


@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getDashboard() {
    return this.adminService.getDashboard();
  }

// ==========================
// Get All Users
// ==========================
@Get('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
getUsers() {
  return this.adminService.getUsers();
}

// ==========================
// Activate User
// ==========================
@Patch('users/:id/activate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
activateUser(
  @Param('id') id: string,
) {
  return this.adminService.activateUser(id);
}

// ==========================
// Deactivate User
// ==========================
@Patch('users/:id/deactivate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
deactivateUser(
  @Param('id') id: string,
) {
  return this.adminService.deactivateUser(id);
}

// ==========================
// Delete User
// ==========================
@Delete('users/:id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
deleteUser(
  @Param('id') id: string,
) {
  return this.adminService.deleteUser(id);
}
// ==========================
// Get All Properties
// ==========================
@Get('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
getProperties() {
  return this.adminService.getProperties();
}

// ==========================
// Get Property Details
// ==========================
@Get('properties/:id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
getProperty(
  @Param('id') id: string,
) {
  return this.adminService.getProperty(id);
}

// ==========================
// Hide Property
// ==========================
@Patch('properties/:id/hide')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
hideProperty(
  @Param('id') id: string,
) {
  return this.adminService.hideProperty(id);
}

// ==========================
// Unhide Property
// ==========================
@Patch('properties/:id/unhide')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
unhideProperty(
  @Param('id') id: string,
) {
  return this.adminService.unhideProperty(id);
}

@Patch('properties/:id/approve')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
approveProperty(@Param('id') id: string) {
  return this.adminService.approveProperty(id);
}

// ==========================
// Delete Property
// ==========================
@Delete('properties/:id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
deleteProperty(
  @Param('id') id: string,
) {
  return this.adminService.deleteProperty(id);
}


// ==========================
// Get User Details
// ==========================
@Get('users/:id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
getUser(
  @Param('id') id: string,
) {
  return this.adminService.getUser(id);
}
// ==========================
// Get All Reviews
// ==========================
@Get('reviews')
@ApiOperation({
  summary: 'Get all reviews',
})
getReviews() {
  return this.adminService.getReviews();
}

// ==========================
// Delete Review
// ==========================
@Delete('reviews/:id')
@ApiOperation({
  summary: 'Delete review',
})
deleteReview(
  @Param('id') id: string,
) {
  return this.adminService.deleteReview(id);
}

// ==========================
// Get All Visits
// ==========================
@Get('visits')
@ApiOperation({
  summary: 'Get all property visits',
})
getVisits() {
  return this.adminService.getVisits();
}

// ==========================
// Approve Visit
// ==========================
@Patch('visits/:id/approve')
@ApiOperation({
  summary: 'Approve property visit',
})
approveVisit(
  @Param('id') id: string,
) {
  return this.adminService.approveVisit(id);
}

// ==========================
// Reject Visit
// ==========================
@Patch('visits/:id/reject')
@ApiOperation({
  summary: 'Reject property visit',
})
rejectVisit(
  @Param('id') id: string,
) {
  return this.adminService.rejectVisit(id);
}

// ==========================
// Complete Visit
// ==========================
@Patch('visits/:id/complete')
@ApiOperation({
  summary: 'Mark visit as completed',
})
completeVisit(
  @Param('id') id: string,
) {
  return this.adminService.completeVisit(id);
}
// ==========================
// Platform Analytics
// ==========================
@Get('analytics')
@ApiOperation({
  summary: 'Get platform analytics',
})
getAnalytics() {
  return this.adminService.getAnalytics();
}
}
