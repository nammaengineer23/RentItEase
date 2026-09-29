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
  
  import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
  
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

          // A network timeout can happen after Razorpay accepted the create
          // request but before our server received the response. Reconcile
          // the deterministic receipt before attempting another POST.
          if (options?.receipt && options?.amount && options?.currency) {
            const existing = await this.findRazorpayOrderByReceipt(
              options.receipt,
              options.amount,
              options.currency,
            );
            if (existing) return existing;
          }

          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
        }
      }

      throw new ServiceUnavailableException(
        'Unable to create a payment order right now. Please try again.',
      );
    }
  
    private async findRazorpayOrderByReceipt(receipt: string, amountInPaise: number, currency: string) {
      try {
        const response = await this.razorpay.orders.all({ receipt, count: 100 });
        const matches = (response?.items ?? []).filter(
          (order: any) =>
            order?.receipt === receipt &&
            order?.amount === amountInPaise &&
            order?.currency === currency &&
            typeof order?.id === 'string',
        );
        return matches.length === 1 ? matches[0] : null;
      } catch {
        throw new ServiceUnavailableException(
          'Unable to confirm the existing payment order right now. Please try again.',
        );
      }
    }
    async createOrder(dto: CreatePaymentOrderDto, user: any) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: {
          property: { include: { owner: { select: { id: true, fullName: true } } } },
          tenant: { select: { id: true, fullName: true, email: true, phone: true } },
          payment: true,
        },
      });

      if (!booking) throw new NotFoundException('Booking not found.');
      if (user.role !== UserRole.ADMIN && booking.tenantId !== user.id) {
        throw new ForbiddenException('Only the booking tenant can make this payment.');
      }
      if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.PAYMENT_PENDING) {
        throw new BadRequestException('Payment cannot be created for booking in ' + booking.status + ' status.');
      }
      if (booking.payment?.status === PaymentStatus.SUCCESS) {
        throw new BadRequestException('This booking has already been paid.');
      }

      const totalAmount = Number(booking.monthlyRent) + Number(booking.securityDeposit);
      const amountInPaise = Math.round(totalAmount * 100);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0 || !Number.isSafeInteger(amountInPaise)) {
        throw new BadRequestException('Invalid booking payment amount.');
      }

      const currency = 'INR';
      const receipt = 'booking_' + booking.id;
      const reservationOrderId = 'pending_' + booking.id;
      const reservationStaleAfterMs = 2 * 60 * 1000;
      let reservedPayment = await this.prisma.payment.findUnique({ where: { bookingId: booking.id } });

      if (reservedPayment?.status === PaymentStatus.CREATED) {
        return this.paymentOrderResponse(reservedPayment, booking);
      }
      if (reservedPayment && reservedPayment.status !== PaymentStatus.FAILED && reservedPayment.status !== PaymentStatus.REFUNDED && reservedPayment.razorpayOrderId !== reservationOrderId) {
        return this.paymentOrderResponse(reservedPayment, booking);
      }

      let reservationToken = randomUUID();

      if (reservedPayment?.status === PaymentStatus.PENDING && reservedPayment.razorpayOrderId === reservationOrderId) {
        const isStale = Date.now() - reservedPayment.updatedAt.getTime() >= reservationStaleAfterMs;

        if (!isStale) {
          return this.paymentOrderResponse(reservedPayment, booking);
        }

        const reclaimed = await this.prisma.payment.updateMany({
          where: {
            id: reservedPayment.id,
            status: PaymentStatus.PENDING,
            razorpayOrderId: reservationOrderId,
            orderCreationToken: reservedPayment.orderCreationToken,
            updatedAt: reservedPayment.updatedAt,
          },
          data: { orderCreationToken: reservationToken },
        });

        if (reclaimed.count !== 1) {
          const current = await this.prisma.payment.findUnique({ where: { bookingId: booking.id } });
          if (current) return this.paymentOrderResponse(current, booking);
          throw new ServiceUnavailableException('Unable to reserve the payment attempt. Please retry.');
        }
      }

      try {
        reservedPayment = await this.prisma.$transaction(async (tx) => {
          const current = await tx.payment.findUnique({ where: { bookingId: booking.id } });
          if (current?.status === PaymentStatus.CREATED) return current;
          if (current && current.status !== PaymentStatus.FAILED && current.status !== PaymentStatus.REFUNDED) return current;

          if (current) {
            reservationToken = randomUUID();
            const claimed = await tx.payment.updateMany({
              where: { id: current.id, status: { in: [PaymentStatus.FAILED, PaymentStatus.REFUNDED] } },
              data: {
                status: PaymentStatus.PENDING,
                razorpayOrderId: reservationOrderId,
                orderCreationToken: reservationToken,
                amount: totalAmount,
                currency,
                failedAt: null,
                failureReason: null,
              },
            });
            if (claimed.count !== 1) throw new BadRequestException('Another payment order request is already in progress. Please retry shortly.');
            return tx.payment.findUniqueOrThrow({ where: { id: current.id } });
          }

          if (booking.status === BookingStatus.APPROVED) {
            const transitioned = await tx.booking.updateMany({
              where: { id: booking.id, status: BookingStatus.APPROVED },
              data: { status: BookingStatus.PAYMENT_PENDING },
            });
            if (transitioned.count !== 1) throw new BadRequestException('Booking state changed while creating the payment order. Please retry.');
          }

          reservationToken = randomUUID();
          return tx.payment.create({
            data: {
              bookingId: booking.id,
              amount: totalAmount,
              currency,
              status: PaymentStatus.PENDING,
              razorpayOrderId: reservationOrderId,
              orderCreationToken: reservationToken,
            },
          });
        });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          const existing = await this.prisma.payment.findUnique({ where: { bookingId: booking.id } });
          if (existing) {
            if (existing.status === PaymentStatus.SUCCESS) throw new BadRequestException('This booking has already been paid.');
            if (existing.status === PaymentStatus.CREATED || (existing.status !== PaymentStatus.FAILED && existing.status !== PaymentStatus.REFUNDED && existing.razorpayOrderId !== reservationOrderId)) {
              return this.paymentOrderResponse(existing, booking);
            }
          }
        }
        throw error;
      }

      if (!reservedPayment) throw new ServiceUnavailableException('Unable to reserve the payment attempt. Please try again.');
      if (reservedPayment.status !== PaymentStatus.PENDING || reservedPayment.razorpayOrderId !== reservationOrderId || reservedPayment.orderCreationToken !== reservationToken) {
        return this.paymentOrderResponse(reservedPayment, booking);
      }

      let razorpayOrder = await this.findRazorpayOrderByReceipt(receipt, amountInPaise, currency);
      if (!razorpayOrder) {
        try {
          razorpayOrder = await this.createRazorpayOrderWithRetry({
            amount: amountInPaise, currency, receipt,
            notes: { bookingId: booking.id, propertyId: booking.propertyId, tenantId: booking.tenantId },
          });
        } catch (error) {
          await this.prisma.payment.updateMany({
            where: { id: reservedPayment.id, status: PaymentStatus.PENDING, razorpayOrderId: reservationOrderId },
            data: { status: PaymentStatus.FAILED, orderCreationToken: null, failedAt: new Date(), failureReason: 'Razorpay order creation failed.' },
          });
          throw error;
        }
      }

      const linked = await this.prisma.payment.updateMany({
        where: { id: reservedPayment.id, status: PaymentStatus.PENDING, razorpayOrderId: reservationOrderId },
        data: { status: PaymentStatus.CREATED, razorpayOrderId: razorpayOrder.id, orderCreationToken: null, failedAt: null, failureReason: null },
      });
      if (linked.count !== 1) throw new BadRequestException('Payment order state changed while completing the request. Please fetch the current payment status.');

      const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: reservedPayment.id } });
      return this.paymentOrderResponse(payment, booking);
    }

    private paymentOrderResponse(payment: any, booking: any) {
      return {
        success: true,
        message: payment.status === PaymentStatus.CREATED ? 'Existing payment order found.' : 'Payment order is being prepared.',
        data: {
          paymentId: payment.id, bookingId: booking.id, razorpayOrderId: payment.razorpayOrderId,
          amount: Number(payment.amount), amountInPaise: Math.round(Number(payment.amount) * 100),
          currency: payment.currency, status: payment.status, keyId: process.env.RAZORPAY_KEY_ID,
          customer: { name: booking.tenant.fullName, email: booking.tenant.email, phone: booking.tenant.phone },
        },
      };
    }

    // =====================================
    // Verify Razorpay Payment
    // =====================================
  
    async verifyPayment(dto: VerifyPaymentDto, user: any) {
      const payment = await this.prisma.payment.findUnique({
        where: { bookingId: dto.bookingId },
        include: {
          booking: {
            include: {
              property: true,
              tenant: { select: { id: true, fullName: true, email: true, phone: true } },
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found.');
      }

      if (user.role !== UserRole.ADMIN && payment.booking.tenantId !== user.id) {
        throw new ForbiddenException(
          'You do not have permission to verify this payment.',
        );
      }

      if (payment.razorpayOrderId !== dto.razorpayOrderId) {
        throw new BadRequestException('Razorpay order ID does not match.');
      }

      if (payment.status === PaymentStatus.SUCCESS) {
        return {
          success: true,
          message: 'Payment has already been verified.',
          data: serializePrisma(payment),
        };
      }

      if (
        payment.status !== PaymentStatus.CREATED &&
        payment.status !== PaymentStatus.PENDING
      ) {
        throw new BadRequestException(
          `Payment cannot be verified from ${payment.status} status.`,
        );
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        throw new ServiceUnavailableException(
          'Payment verification is temporarily unavailable.',
        );
      }

      const generatedSignature = createHmac('sha256', keySecret)
        .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
        .digest('hex');

      const suppliedSignature = dto.razorpaySignature.trim().toLowerCase();

      if (
        suppliedSignature.length !== generatedSignature.length ||
        !/^[a-f0-9]+$/.test(suppliedSignature) ||
        !timingSafeEqual(
          Buffer.from(generatedSignature, 'hex'),
          Buffer.from(suppliedSignature, 'hex'),
        )
      ) {
        // Never mutate the pending payment on an invalid callback.
        throw new BadRequestException(
          'Payment signature verification failed.',
        );
      }

      let razorpayOrder: any;
      let razorpayPayment: any;

      try {
        [razorpayOrder, razorpayPayment] = await Promise.all([
          this.razorpay.orders.fetch(dto.razorpayOrderId),
          this.razorpay.payments.fetch(dto.razorpayPaymentId),
        ]);
      } catch {
        throw new ServiceUnavailableException(
          'Unable to verify the payment with Razorpay right now. Please try again.',
        );
      }

      const expectedAmountInPaise = Math.round(Number(payment.amount) * 100);

      if (
        !Number.isSafeInteger(expectedAmountInPaise) ||
        expectedAmountInPaise <= 0 ||
        razorpayOrder.id !== payment.razorpayOrderId ||
        razorpayOrder.amount !== expectedAmountInPaise ||
        razorpayOrder.currency !== payment.currency ||
        razorpayPayment.id !== dto.razorpayPaymentId ||
        razorpayPayment.order_id !== payment.razorpayOrderId ||
        razorpayPayment.amount !== expectedAmountInPaise ||
        razorpayPayment.currency !== payment.currency ||
        razorpayPayment.status !== 'captured'
      ) {
        throw new BadRequestException(
          'Payment details could not be verified.',
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // Conditional update makes the success transition atomic: only the
        // first concurrent verifier can claim the payment.
        const claimed = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: {
              in: [PaymentStatus.CREATED, PaymentStatus.PENDING],
            },
          },
          data: {
            status: PaymentStatus.SUCCESS,
            razorpayPaymentId: dto.razorpayPaymentId,
            razorpaySignature: suppliedSignature,
            paidAt: new Date(),
            failedAt: null,
            failureReason: null,
          },
        });

        if (claimed.count === 0) {
          const current = await tx.payment.findUnique({
            where: { id: payment.id },
          });

          if (current?.status === PaymentStatus.SUCCESS) {
            return { payment: current, alreadyProcessed: true };
          }

          throw new BadRequestException(
            'Payment could not be completed because its state changed. Please check the payment status.',
          );
        }

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.PAID },
        });

        await tx.property.update({
          where: { id: payment.booking.propertyId },
          data: { isAvailable: false },
        });

        await tx.invoice.upsert({
          where: { invoiceNumber: `RIE-${payment.bookingId}` },
          update: {
            status: 'PAID',
            amount: payment.amount,
            totalAmount: payment.amount,
            paymentId: payment.id,
          },
          create: {
            invoiceNumber: `RIE-${payment.bookingId}`,
            userId: payment.booking.tenantId,
            paymentId: payment.id,
            amount: payment.amount,
            taxAmount: 0,
            totalAmount: payment.amount,
            currency: payment.currency,
            status: 'PAID',
            description: `Payment invoice for ${payment.booking.property.title}`,
          },
        });

        const current = await tx.payment.findUnique({
          where: { id: payment.id },
        });

        if (!current) {
          throw new NotFoundException(
            'Payment record not found after verification.',
          );
        }

        return { payment: current, alreadyProcessed: false };
      });

      if (result.alreadyProcessed) {
        return {
          success: true,
          message: 'Payment has already been verified.',
          data: serializePrisma(result.payment),
        };
      }

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
          paymentId: result.payment.id,
          bookingId: payment.bookingId,
          propertyId: payment.booking.propertyId,
        },
      );

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
          paymentId: result.payment.id,
          bookingId: payment.bookingId,
          propertyId: payment.booking.propertyId,
        },
      );

      return {
        success: true,
        message: 'Payment verified successfully.',
        data: serializePrisma(result.payment),
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
