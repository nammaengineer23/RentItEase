import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.invoicesService.findAllByUser(userId);
  }

  @Get('payment/:paymentId')
  findByPayment(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.invoicesService.findByPayment(paymentId, user);
  }

  @Get('booking/:bookingId')
  findByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.invoicesService.findByBooking(bookingId, user);
  }

  @Get('membership/:membershipId')
  findByMembership(
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.invoicesService.findByMembership(membershipId, user);
  }

  @Get('number/:invoiceNumber')
  findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.findByInvoiceNumber(invoiceNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/paid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  markPaid(@Param('id') id: string) {
    return this.invoicesService.markPaid(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }
}
