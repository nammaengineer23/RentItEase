import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    ServiceUnavailableException,
  } from '@nestjs/common';
  
  import Razorpay from 'razorpay';
  
  import {
    BookingStatus,
    NotificationType,
    PaymentStatus,
    UserRole,
  } from '@prisma/client';
  
  import { createHmac } from 'crypto';
  
  import { PrismaService } from '../../prisma/prisma.service';
  import { serializePrisma } from '../../common/utils/prisma-response.util';
  
  import { NotificationsService } from '../notifications/notifications.service';
  import { PushNotificationsService } from '../push-notifications/push-notifications.service';
  
  import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
  import { VerifyPaymentDto } from './dto/verify-payment.dto';
  
  @Injectable()
  export class PaymentsService {
    private readonly razorpay: Razorpay;
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly notificationsService: NotificationsService,
      private readonly pushNotificationsService: PushNotificationsService,
    ) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
      if (!keyId || !keySecret) {
        throw new Error(
          'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.',
        );
      }
  
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  
    // =====================================
    // Create Razorpay Order
    // =====================================

    private async createRazorpayOrderWithRetry(options: any) {
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          return await this.razorpay.orders.create(options);
        } catch (error: any) {
          const statusCode = error?.statusCode ?? error?.status;
          const retryable =
            !statusCode || statusCode >= 500 || error?.code === 'ECONNRESET';

          if (!retryable || attempt === maxAttempts) {
            throw new ServiceUnavailableException(
              'Unable to create a payment order right now. Please try again.',
            );
          }

          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
        }
      }

      throw new ServiceUnavailableException(
        'Unable to create a payment order right now. Please try again.',
      );
    }
  
    async createOrder(dto: CreatePaymentOrderDto, user: any) {
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: dto.bookingId,
        },
        include: {
          property: {
            include: {
              owner: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          payment: true,
        },
      });
  
      if (!booking) {
        throw new NotFoundException('Booking not found.');
      }
  
      if (
        user.role !== UserRole.ADMIN &&
        booking.tenantId !== user.id
      ) {
        throw new ForbiddenException(
          'Only the booking tenant can make this payment.',
        );
      }
  
      if (
        booking.status !== BookingStatus.APPROVED &&
        booking.status !== BookingStatus.PAYMENT_PENDING
      ) {
        throw new BadRequestException(
          `Payment cannot be created for booking in ${booking.status} status.`,
        );
      }
  
      if (booking.payment?.status === PaymentStatus.SUCCESS) {
        throw new BadRequestException(
          'This booking has already been paid.',
        );
      }
  
      // -------------------------------------
      // Reuse existing pending Razorpay order
      // -------------------------------------
  
      if (
        booking.payment &&
        booking.payment.status !== PaymentStatus.FAILED &&
        booking.payment.status !== PaymentStatus.REFUNDED
      ) {
        return {
          success: true,
          message: 'Existing payment order found.',
          data: {
            paymentId: booking.payment.id,
            razorpayOrderId: booking.payment.razorpayOrderId,
            amount: Number(booking.payment.amount),
            currency: booking.payment.currency,
            status: booking.payment.status,
            keyId: process.env.RAZORPAY_KEY_ID,
          },
        };
      }
  
      // -------------------------------------
      // Calculate amount on server
      // -------------------------------------
  
      const monthlyRent = Number(booking.monthlyRent);
      const securityDeposit = Number(booking.securityDeposit);
  
      const totalAmount = monthlyRent + securityDeposit;
  
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new BadRequestException(
          'Invalid booking payment amount.',
        );
      }
  
      // Razorpay expects amount in paise.
      const amountInPaise = Math.round(totalAmount * 100);
  
      const receipt = `booking_${booking.id}`.slice(0, 40);
  
      // -------------------------------------
      // Create Razorpay order
      // -------------------------------------
  
      const razorpayOrder = await this.createRazorpayOrderWithRetry({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          bookingId: booking.id,
          propertyId: booking.propertyId,
          tenantId: booking.tenantId,
        },
      });
  
      // -------------------------------------
      // Create Payment record
      // -------------------------------------
  
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          currency: 'INR',
          status: PaymentStatus.CREATED,
          razorpayOrderId: razorpayOrder.id,
        },
      });
  
      // -------------------------------------
      // Move booking to payment pending
      // -------------------------------------
  
      await this.prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: BookingStatus.PAYMENT_PENDING,
        },
      });
  
      return {
        success: true,
        message: 'Payment order created successfully.',
        data: {
          paymentId: payment.id,
          bookingId: booking.id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
          amountInPaise,
          currency: 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
          customer: {
            name: booking.tenant.fullName,
            email: booking.tenant.email,
            phone: booking.tenant.phone,
          },
        },
      };
    }
  
    // =====================================
    // Verify Razorpay Payment
    // =====================================
  
    async verifyPayment(dto: VerifyPaymentDto, user: any) {
      const payment = await this.prisma.payment.findUnique({
        where: {
          bookingId: dto.bookingId,
        },
        include: {
          booking: {
            include: {
              property: true,
              tenant: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
  
      if (!payment) {
        throw new NotFoundException(
          'Payment record not found.',
        );
      }
  
      if (
        user.role !== UserRole.ADMIN &&
        payment.booking.tenantId !== user.id
      ) {
        throw new ForbiddenException(
          'You do not have permission to verify this payment.',
        );
      }
  
      if (
        payment.razorpayOrderId !== dto.razorpayOrderId
      ) {
        throw new BadRequestException(
          'Razorpay order ID does not match.',
        );
      }
  
      if (payment.status === PaymentStatus.SUCCESS) {
        return {
          success: true,
          message: 'Payment has already been verified.',
          data: serializePrisma(payment),
        };
      }
  
      // -------------------------------------
      // Verify Razorpay signature
      // -------------------------------------
  
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
      if (!keySecret) {
        throw new BadRequestException(
          'Razorpay secret is not configured.',
        );
      }
  
      const generatedSignature = createHmac(
        'sha256',
        keySecret,
      )
        .update(
          `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`,
        )
        .digest('hex');
  
      if (generatedSignature !== dto.razorpaySignature) {
        await this.prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.FAILED,
            failedAt: new Date(),
            failureReason: 'Invalid Razorpay signature.',
          },
        });
  
        throw new BadRequestException(
          'Payment signature verification failed.',
        );
      }
  
      // -------------------------------------
      // Mark payment successful
      // -------------------------------------
  
      const updatedPayment = await this.prisma.$transaction(
        async (tx) => {
          const updated = await tx.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status: PaymentStatus.SUCCESS,
              razorpayPaymentId: dto.razorpayPaymentId,
              razorpaySignature: dto.razorpaySignature,
              paidAt: new Date(),
            },
          });
  
          await tx.booking.update({
            where: {
              id: payment.bookingId,
            },
            data: {
              status: BookingStatus.PAID,
            },
          });

          await tx.invoice.upsert({
            where: {
              invoiceNumber: `RIE-${payment.bookingId}`,
            },
            update: {
              status: 'PAID',
              amount: payment.amount,
              totalAmount: payment.amount,
              paymentId: updated.id,
            },
            create: {
              invoiceNumber: `RIE-${payment.bookingId}`,
              userId: payment.booking.tenantId,
              paymentId: updated.id,
              amount: payment.amount,
              taxAmount: 0,
              totalAmount: payment.amount,
              currency: payment.currency,
              status: 'PAID',
              description: `Payment invoice for ${payment.booking.property.title}`,
            },
          });
  
          return updated;
        },
      );
  
      // -------------------------------------
      // Notify tenant
      // -------------------------------------
  
      await this.notificationsService.createNotification(
        payment.booking.tenantId,
        'Payment Successful',
        `Payment for "${payment.booking.property.title}" was successful.`,
        NotificationType.GENERAL,
        payment.booking.id,
      );
  
      await this.pushNotificationsService.sendToUser(
        payment.booking.tenantId,
        'Payment Successful',
        `Payment for "${payment.booking.property.title}" was successful.`,
        {
          type: 'PAYMENT_SUCCESS',
          paymentId: updatedPayment.id,
          bookingId: payment.bookingId,
          propertyId: payment.booking.propertyId,
        },
      );
  
      // -------------------------------------
      // Notify owner
      // -------------------------------------
  
      await this.notificationsService.createNotification(
        payment.booking.property.ownerId,
        'Booking Payment Received',
        `Payment received for "${payment.booking.property.title}".`,
        NotificationType.GENERAL,
        payment.booking.id,
      );
  
      await this.pushNotificationsService.sendToUser(
        payment.booking.property.ownerId,
        'Booking Payment Received',
        `Payment received for "${payment.booking.property.title}".`,
        {
          type: 'BOOKING_PAYMENT_RECEIVED',
          paymentId: updatedPayment.id,
          bookingId: payment.bookingId,
          propertyId: payment.booking.propertyId,
        },
      );
  
      return {
        success: true,
        message: 'Payment verified successfully.',
        data: serializePrisma(updatedPayment),
      };
    }
  
    // =====================================
    // Get Payment
    // =====================================
  
    async findOne(id: string, user: any) {
      const payment = await this.prisma.payment.findUnique({
        where: {
          id,
        },
        include: {
          booking: {
            include: {
              property: true,
              tenant: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
  
      if (!payment) {
        throw new NotFoundException('Payment not found.');
      }
  
      if (
        user.role !== UserRole.ADMIN &&
        payment.booking.tenantId !== user.id &&
        payment.booking.property.ownerId !== user.id
      ) {
        throw new ForbiddenException(
          'You do not have access to this payment.',
        );
      }
  
      return {
        success: true,
        data: serializePrisma(payment),
      };
    }
  }
