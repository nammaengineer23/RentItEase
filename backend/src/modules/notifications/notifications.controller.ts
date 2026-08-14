import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request as Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  // ==========================================
  // Get My Notifications
  // ==========================================

  @Get()
  @ApiOperation({
    summary: 'Get my notifications',
  })
  getMyNotifications(@Req() req: Request) {
    return this.notificationsService.getMyNotifications(
      req.user,
    );
  }

  // ==========================================
  // Get Unread Count
  // ==========================================

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
  })
  getUnreadCount(@Req() req: Request) {
    return this.notificationsService.getUnreadCount(
      req.user,
    );
  }

  // ==========================================
  // Mark Single Notification Read
  // ==========================================

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
  })
  markAsRead(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.notificationsService.markAsRead(
      id,
      req.user,
    );
  }

  // ==========================================
  // Mark All Notifications Read
  // ==========================================

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
  })
  markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead(
      req.user,
    );
  }

  // ==========================================
  // Delete Notification
  // ==========================================

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete notification',
  })
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.notificationsService.remove(
      id,
      req.user,
    );
  }
}