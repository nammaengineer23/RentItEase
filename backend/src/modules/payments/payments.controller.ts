import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
  } from '@nestjs/common';
  
  import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
  } from '@nestjs/swagger';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  import { PaymentsService } from './payments.service';
  import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
  import { VerifyPaymentDto } from './dto/verify-payment.dto';
  
  @ApiTags('Payments')
  @Controller('payments')
  export class PaymentsController {
    constructor(
      private readonly paymentsService: PaymentsService,
    ) {}
  
    // =====================================
    // Create Razorpay Order
    // =====================================
  
    @Post('order')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
      summary: 'Create Razorpay payment order for booking',
    })
    createOrder(
      @Body() dto: CreatePaymentOrderDto,
      @Request() req: any,
    ) {
      return this.paymentsService.createOrder(
        dto,
        req.user,
      );
    }
  
    // =====================================
    // Verify Payment
    // =====================================
  
    @Post('refund/:paymentId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Initiate a full refund for a successful payment' })
    refundPayment(
      @Param('paymentId') paymentId: string,
      @Body() body: { reason?: string },
      @Request() req: any,
    ) {
      return this.paymentsService.refundPayment(
        paymentId,
        body?.reason,
        req.user,
      );
    }

    @Post('refund/:refundId/reconcile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reconcile an uncertain Razorpay refund' })
    reconcileRefund(
      @Param('refundId') refundId: string,
      @Request() req: any,
    ) {
      return this.paymentsService.reconcileRefund(refundId, req.user);
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Receive Razorpay webhook events' })
    handleWebhook(@Request() req: any) {
      return this.paymentsService.handleWebhook(
        req.rawBody,
        req.headers['x-razorpay-signature'],
        req.headers['x-razorpay-event-id'],
      );
    }

    @Post('verify')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
      summary: 'Verify Razorpay payment',
    })
    verifyPayment(
      @Body() dto: VerifyPaymentDto,
      @Request() req: any,
    ) {
      return this.paymentsService.verifyPayment(
        dto,
        req.user,
      );
    }
  
    // =====================================
    // Get Payment
    // =====================================
  
    @Get(':id/reconciliation')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check payment, booking, invoice and refund consistency' })
    reconcilePaymentState(
      @Param('id') paymentId: string,
      @Request() req: any,
    ) {
      return this.paymentsService.reconcilePaymentState(paymentId, req.user);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
      summary: 'Get payment by ID',
    })
    findOne(
      @Param('id') id: string,
      @Request() req: any,
    ) {
      return this.paymentsService.findOne(
        id,
        req.user,
      );
    }
  }