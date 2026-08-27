import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('request-owner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request admin approval to become an owner' })
  requestOwner(@Req() request: { user: { id: string } }) {
    return this.usersService.requestOwnerRole(request.user.id);
  }

  @Get('owner-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  getOwnerRequests() {
    return this.usersService.getOwnerRequests();
  }

  @Patch(':id/owner-request/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  approveOwner(@Param('id') id: string) {
    return this.usersService.reviewOwnerRequest(id, true);
  }

  @Patch(':id/owner-request/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  rejectOwner(@Param('id') id: string) {
    return this.usersService.reviewOwnerRequest(id, false);
  }
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin only endpoint',
  })
  getAdminData() {
    return {
      success: true,
      message: 'Welcome Admin!',
    };
  }
}
