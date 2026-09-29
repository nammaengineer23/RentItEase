import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.invoicesService.create(dto, user);
  }

  @Get('user/:userId')
  findAllByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.invoicesService.findAllByUser(userId, user);
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
  findByInvoiceNumber(
    @Param('invoiceNumber') invoiceNumber: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.invoicesService.findByInvoiceNumber(invoiceNumber, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.invoicesService.findOne(id, user);
  }

  @Patch(':id/paid')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  markPaid(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.invoicesService.markPaid(id, user);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.invoicesService.cancel(id, user);
  }
}
