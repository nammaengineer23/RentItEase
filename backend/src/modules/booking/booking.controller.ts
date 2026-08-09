import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // =====================================
  // Create Booking
  // =====================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create booking from approved property visit',
  })
  create(@Body() dto: CreateBookingDto, @Request() req: any) {
    return this.bookingService.create(dto, req.user);
  }

  // =====================================
  // Tenant Bookings
  // =====================================

  @Get('tenant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get logged-in tenant bookings',
  })
  getTenantBookings(@Request() req: any) {
    return this.bookingService.getTenantBookings(req.user);
  }

  // =====================================
  // Owner Bookings
  // =====================================

  @Get('owner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get owner booking requests',
  })
  getOwnerBookings(@Request() req: any) {
    return this.bookingService.getOwnerBookings(req.user);
  }

  // =====================================
  // Get Booking
  // =====================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get booking by ID',
  })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.bookingService.findOne(id, req.user);
  }

  // =====================================
  // Approve Booking
  // =====================================

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Owner approves booking',
  })
  approve(@Param('id') id: string, @Request() req: any) {
    return this.bookingService.approve(id, req.user);
  }

  // =====================================
  // Reject Booking
  // =====================================

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Owner rejects booking',
  })
  reject(@Param('id') id: string, @Request() req: any) {
    return this.bookingService.reject(id, req.user);
  }

  // =====================================
  // Payment Pending
  // =====================================

  @Patch(':id/payment-pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Move approved booking to payment pending',
  })
  markPaymentPending(@Param('id') id: string, @Request() req: any) {
    return this.bookingService.markPaymentPending(id, req.user);
  }

  // =====================================
  // Cancel Booking
  // =====================================

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel booking',
  })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.bookingService.cancel(id, req.user);
  }

  // =====================================
  // Complete Booking
  // =====================================

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete paid booking',
  })
  complete(@Param('id') id: string, @Request() req: any) {
    return this.bookingService.complete(id, req.user);
  }
}
