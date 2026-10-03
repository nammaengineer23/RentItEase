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
  import { Throttle } from '@nestjs/throttler';
  
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
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
  
    @Post('verify')
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
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
  
    // Razorpay webhook endpoint. Signature is verified from the raw request body.
    @Post('webhook')
    @Throttle({ default: { limit: 30, ttl: 60_000 } })
    @ApiOperation({ summary: 'Receive Razorpay webhook events' })
    webhook(
      @Req() req: any,
      @Headers('x-razorpay-event-id') eventId: string,
      @Headers('x-razorpay-signature') signature: string,
    ) {
      return this.paymentsService.handleWebhook(req.rawBody, eventId, signature);
    }

    // =====================================
    // Get Payment
    // =====================================
  
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