import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.invoicesService.findAllByUser(userId);
  }

  @Get('payment/:paymentId')
  findByPayment(@Param('paymentId') paymentId: string) {
    return this.invoicesService.findByPayment(paymentId);
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
  markPaid(@Param('id') id: string) {
    return this.invoicesService.markPaid(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }
}
