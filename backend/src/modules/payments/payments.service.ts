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
  Prisma,
    NotificationType,
    PaymentStatus,
    UserRole,
  } from '@prisma/client';
  
  import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
  
  import { PrismaService } from '../../prisma/prisma.service';
  import { serializePrisma } from '../../common/utils/prisma-response.util';
  import { toPaise } from '../../common/utils/money.util';
  
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
      if (!booking.property.isAvailable) {
        throw new BadRequestException('This property is no longer available for payment.');
      }
      if (booking.payment?.status === PaymentStatus.SUCCESS) {
        throw new BadRequestException('This booking has already been paid.');
      }

      const totalAmount = new Prisma.Decimal(booking.monthlyRent).add(
        new Prisma.Decimal(booking.securityDeposit),
      );
      const amountInPaise = toPaise(totalAmount);
      if (totalAmount.lte(0)) {
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
          amount: new Prisma.Decimal(payment.amount).toNumber(), amountInPaise: toPaise(payment.amount),
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
        payment.booking.status !== BookingStatus.PAYMENT_PENDING &&
        payment.booking.status !== BookingStatus.APPROVED
      ) {
        throw new BadRequestException(
          `Booking cannot be paid from ${payment.booking.status} status.`,
        );
      }

      if (!payment.booking.property.isAvailable) {
        throw new BadRequestException(
          'This property is no longer available for payment.',
        );
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

      const expectedAmountInPaise = toPaise(payment.amount);

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

      const result = await this.runPaymentSuccessTransaction(
        payment.id,
        dto.razorpayPaymentId,
        suppliedSignature,
        payment,
      );

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


    private async runPaymentSuccessTransaction(
      paymentId: string,
      razorpayPaymentId: string,
      razorpaySignature: string | undefined,
      payment: any,
      allowFailed = false,
    ) {
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          return await this.prisma.$transaction(async (tx) => {
            const claimed = await tx.payment.updateMany({
              where: {
                id: paymentId,
                status: {
                  in: allowFailed
                    ? [PaymentStatus.CREATED, PaymentStatus.PENDING, PaymentStatus.FAILED]
                    : [PaymentStatus.CREATED, PaymentStatus.PENDING],
                },
              },
              data: {
                status: PaymentStatus.SUCCESS,
                razorpayPaymentId,
                ...(razorpaySignature ? { razorpaySignature } : {}),
                paidAt: new Date(),
                failedAt: null,
                failureReason: null,
              },
            });

            if (claimed.count === 0) {
              const current = await tx.payment.findUnique({ where: { id: paymentId } });
              if (current?.status === PaymentStatus.SUCCESS) {
                return { payment: current, alreadyProcessed: true };
              }
              throw new BadRequestException(
                'Payment could not be completed because its state changed. Please check the payment status.',
              );
            }

            const bookingTransition = await tx.booking.updateMany({
              where: {
                id: payment.bookingId,
                status: { in: [BookingStatus.PAYMENT_PENDING, BookingStatus.APPROVED] },
              },
              data: { status: BookingStatus.PAID },
            });
            if (bookingTransition.count !== 1) {
              throw new BadRequestException(
                'Booking state changed while completing the payment. Please reconcile the payment.',
              );
            }

            const propertyTransition = await tx.property.updateMany({
              where: { id: payment.booking.propertyId, isAvailable: true },
              data: { isAvailable: false },
            });
            if (propertyTransition.count !== 1) {
              throw new BadRequestException(
                'Property availability changed while completing the payment. Please reconcile the payment.',
              );
            }

            await tx.invoice.upsert({
              where: { invoiceNumber: `RIE-${payment.bookingId}` },
              update: {
                status: 'PAID',
                amount: payment.amount,
                totalAmount: payment.amount,
                paymentId,
              },
              create: {
                invoiceNumber: `RIE-${payment.bookingId}`,
                userId: payment.booking.tenantId,
                paymentId,
                amount: payment.amount,
                taxAmount: 0,
                totalAmount: payment.amount,
                currency: payment.currency,
                status: 'PAID',
                description: `Payment invoice for ${payment.booking.property.title}`,
              },
            });

            const current = await tx.payment.findUnique({ where: { id: paymentId } });
            if (!current) throw new NotFoundException('Payment record not found after verification.');
            return { payment: current, alreadyProcessed: false };
          });
        } catch (error: any) {
          if (error?.code === 'P2034' && attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 100));
            continue;
          }
          throw error;
        }
      }

      throw new ServiceUnavailableException('Unable to complete payment transaction. Please retry.');
    }

    // =====================================
    // Razorpay Refunds
    // =====================================

    async refundPayment(paymentId: string, reason: string | undefined, user: any) {
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can initiate payment refunds.');
      }

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });

      if (!payment) throw new NotFoundException('Payment not found.');
      if (payment.status !== PaymentStatus.SUCCESS) {
        throw new BadRequestException('Only successful payments can be refunded.');
      }
      if (!payment.razorpayPaymentId) {
        throw new BadRequestException('Razorpay payment ID is missing.');
      }

      const existing = await this.prisma.paymentRefund.findFirst({
        where: {
          paymentId: payment.id,
          status: { in: ['PENDING', 'UNKNOWN'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        return {
          success: true,
          message: 'A refund already exists for this payment and requires reconciliation.',
          data: serializePrisma(existing),
        };
      }

      const amountInPaise = toPaise(payment.amount);
      if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
        throw new BadRequestException('Invalid refund amount.');
      }

      let refund;
      try {
        refund = await this.prisma.paymentRefund.create({
          data: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: 'PENDING',
            activeKey: payment.id,
            reason: reason?.trim().slice(0, 500) || null,
          },
        });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          const activeRefund = await this.prisma.paymentRefund.findFirst({
            where: {
              paymentId: payment.id,
              status: { in: ['PENDING', 'UNKNOWN'] },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (activeRefund) {
            return {
              success: true,
              message: 'A refund already exists for this payment and requires reconciliation.',
              data: serializePrisma(activeRefund),
            };
          }
        }
        throw error;
      }

      try {
        const razorpayRefund: any = await this.razorpay.payments.refund(
          payment.razorpayPaymentId,
          {
            amount: amountInPaise,
            notes: {
              paymentId: payment.id,
              bookingId: payment.bookingId,
              refundId: refund.id,
            },
          },
        );

        await this.prisma.paymentRefund.update({
          where: { id: refund.id },
          data: {
            razorpayRefundId: razorpayRefund.id,
            status: razorpayRefund.status === 'processed' ? 'PROCESSED' : 'PENDING',
            activeKey: razorpayRefund.status === 'processed' ? null : payment.id,
            processedAt: razorpayRefund.status === 'processed' ? new Date() : null,
          },
        });

        if (razorpayRefund.status === 'processed') {
          await this.prisma.payment.updateMany({
            where: { id: payment.id, status: PaymentStatus.SUCCESS },
            data: { status: PaymentStatus.REFUNDED },
          });
        }

        return {
          success: true,
          message: 'Refund initiated successfully.',
          data: serializePrisma({
            ...refund,
            razorpayRefundId: razorpayRefund.id,
            status: razorpayRefund.status === 'processed' ? 'PROCESSED' : 'PENDING',
          }),
        };
      } catch (error: any) {
        await this.prisma.paymentRefund.update({
          where: { id: refund.id },
          data: {
            status: 'UNKNOWN',
            activeKey: payment.id,
            failureReason: String(error?.message ?? 'Refund request outcome is unknown.').slice(0, 1000),
          },
        });

        throw new ServiceUnavailableException(
          'Refund request outcome could not be confirmed. Reconcile the refund before retrying.',
        );
      }
    }

    // =====================================
    // Razorpay Webhook / Reconciliation
    // =====================================

    async handleWebhook(rawBody: Buffer | undefined, signatureHeader: string | string[] | undefined, eventIdHeader: string | string[] | undefined) {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
      const eventId = Array.isArray(eventIdHeader) ? eventIdHeader[0] : eventIdHeader;

      if (!webhookSecret || !rawBody || !signature || !eventId) {
        throw new BadRequestException('Invalid Razorpay webhook request.');
      }

      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (
        signature.length !== expectedSignature.length ||
        !/^[a-f0-9]+$/i.test(signature) ||
        !timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(signature.toLowerCase(), 'hex'),
        )
      ) {
        throw new ForbiddenException('Invalid Razorpay webhook signature.');
      }

      let payload: any;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        throw new BadRequestException('Invalid Razorpay webhook payload.');
      }

      const eventType = typeof payload?.event === 'string' ? payload.event : 'unknown';
      const entity = payload?.payload?.payment?.entity;
      const refundEntity = payload?.payload?.refund?.entity;
      const orderEntity = payload?.payload?.order?.entity;
      const razorpayPaymentId =
        typeof entity?.id === 'string'
          ? entity.id
          : typeof refundEntity?.payment_id === 'string'
            ? refundEntity.payment_id
            : undefined;
      const razorpayOrderId =
        typeof entity?.order_id === 'string'
          ? entity.order_id
          : typeof orderEntity?.id === 'string'
            ? orderEntity.id
            : undefined;

      let event = await this.prisma.paymentWebhookEvent.findUnique({
        where: { eventId },
      });

      if (event?.status === 'PROCESSED' || event?.status === 'IGNORED') {
        return { success: true, message: 'Webhook event already processed.' };
      }

      if (!event) {
        try {
          event = await this.prisma.paymentWebhookEvent.create({
            data: {
              eventId,
              eventType,
              razorpayOrderId,
              razorpayPaymentId,
              payload,
            },
          });
        } catch (error: any) {
          if (error?.code === 'P2002') {
            event = await this.prisma.paymentWebhookEvent.findUnique({
              where: { eventId },
            });
            if (!event) throw error;
            if (event.status === 'PROCESSED' || event.status === 'IGNORED') {
              return { success: true, message: 'Webhook event already processed.' };
            }
          } else {
            throw error;
          }
        }
      }

      if (!event) {
        throw new ServiceUnavailableException('Unable to record Razorpay webhook event.');
      }

      try {
        if (eventType === 'payment.captured') {
          if (!razorpayOrderId || !razorpayPaymentId) {
            throw new BadRequestException('Webhook payment identifiers are missing.');
          }

          await this.reconcileCapturedPayment(
            razorpayOrderId,
            razorpayPaymentId,
          );
        } else if (
          eventType === 'refund.created' ||
          eventType === 'refund.processed' ||
          eventType === 'refund.failed'
        ) {
          if (!refundEntity?.id) {
            throw new BadRequestException('Webhook refund identifier is missing.');
          }
          await this.reconcileRefundWebhook(
            refundEntity.id,
            eventType,
            refundEntity.payment_id,
            refundEntity.amount,
            refundEntity.currency,
            refundEntity.status,
            refundEntity.error_description ?? refundEntity.error_reason,
          );
        } else if (eventType === 'payment.failed') {
          if (razorpayOrderId) {
            await this.reconcileFailedPayment(
              razorpayOrderId,
              razorpayPaymentId,
              entity?.error_description ?? entity?.error_reason ?? 'Razorpay payment failed.',
            );
          }
        }

        await this.prisma.paymentWebhookEvent.update({
          where: { id: event.id },
          data: {
            status:
              eventType === 'payment.captured' ||
              eventType === 'payment.failed' ||
              eventType === 'refund.created' ||
              eventType === 'refund.processed' ||
              eventType === 'refund.failed'
                ? 'PROCESSED'
                : 'IGNORED',
            processedAt: new Date(),
            errorMessage: null,
          },
        });

        return { success: true, message: 'Webhook received.' };
      } catch (error: any) {
        await this.prisma.paymentWebhookEvent.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            errorMessage: String(error?.message ?? 'Webhook processing failed.').slice(0, 1000),
          },
        });
        throw error;
      }
    }

    private async reconcileCapturedPayment(
      razorpayOrderId: string,
      razorpayPaymentId: string,
    ) {
      const payment = await this.prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: {
          booking: {
            include: {
              property: true,
              tenant: { select: { id: true, fullName: true, email: true, phone: true } },
            },
          },
        },
      });

      if (!payment || payment.status === PaymentStatus.SUCCESS) return;

      let razorpayOrder: any;
      let razorpayPayment: any;
      try {
        [razorpayOrder, razorpayPayment] = await Promise.all([
          this.razorpay.orders.fetch(razorpayOrderId),
          this.razorpay.payments.fetch(razorpayPaymentId),
        ]);
      } catch {
        throw new ServiceUnavailableException(
          'Unable to reconcile the Razorpay payment right now.',
        );
      }

      const expectedAmountInPaise = toPaise(payment.amount);
      if (
        !Number.isSafeInteger(expectedAmountInPaise) ||
        expectedAmountInPaise <= 0 ||
        razorpayOrder.id !== payment.razorpayOrderId ||
        razorpayOrder.amount !== expectedAmountInPaise ||
        razorpayOrder.currency !== payment.currency ||
        razorpayPayment.id !== razorpayPaymentId ||
        razorpayPayment.order_id !== payment.razorpayOrderId ||
        razorpayPayment.amount !== expectedAmountInPaise ||
        razorpayPayment.currency !== payment.currency ||
        razorpayPayment.status !== 'captured'
      ) {
        throw new BadRequestException('Razorpay webhook payment details failed reconciliation.');
      }

      const result = await this.runPaymentSuccessTransaction(
        payment.id,
        razorpayPaymentId,
        undefined,
        payment,
        true,
      );

      if (!result.alreadyProcessed && result.payment) {
        await this.sendPaymentSuccessNotifications(payment);
      }
    }

    async reconcileRefund(refundId: string, user: any) {
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can reconcile payment refunds.');
      }

      const refund = await this.prisma.paymentRefund.findUnique({
        where: { id: refundId },
        include: { payment: { include: { booking: true } } },
      });

      if (!refund) throw new NotFoundException('Refund record not found.');
      if (refund.status === 'PROCESSED' || refund.status === 'FAILED') {
        return { success: true, message: 'Refund is already reconciled.', data: serializePrisma(refund) };
      }

      if (!refund.payment.razorpayPaymentId) {
        throw new BadRequestException('Razorpay payment ID is missing.');
      }

      let gatewayRefund: any = null;
      if (refund.razorpayRefundId) {
        try {
          gatewayRefund = await this.razorpay.refunds.fetch(refund.razorpayRefundId);
        } catch {
          throw new ServiceUnavailableException(
            'Unable to fetch the Razorpay refund right now. No new refund will be created.',
          );
        }
      } else {
        try {
          const gatewayPayment: any = await this.razorpay.payments.fetch(
            refund.payment.razorpayPaymentId,
          );
          const expectedAmountInPaise = toPaise(refund.amount);
          const refundedAmount = Number(gatewayPayment?.amount_refunded ?? 0);

          if (
            gatewayPayment?.id !== refund.payment.razorpayPaymentId ||
            gatewayPayment?.currency !== refund.currency ||
            !Number.isSafeInteger(expectedAmountInPaise) ||
            refundedAmount < expectedAmountInPaise
          ) {
            throw new BadRequestException(
              'Razorpay payment does not confirm this refund. Manual reconciliation is required.',
            );
          }

          const paymentAmountInPaise = toPaise(refund.payment.amount);
          const processed = gatewayPayment?.refund_status === 'full' ||
            (gatewayPayment?.refund_status === 'processed' &&
              refundedAmount >= paymentAmountInPaise) ||
            refundedAmount >= paymentAmountInPaise;

          if (!processed) {
            return {
              success: true,
              message: 'Razorpay has not confirmed the refund yet. No new refund was created.',
              data: serializePrisma(refund),
            };
          }

          const updated = await this.prisma.$transaction(async (tx) => {
            const current = await tx.paymentRefund.update({
              where: { id: refund.id },
              data: {
                status: 'PROCESSED',
                activeKey: null,
                processedAt: new Date(),
                failureReason: null,
              },
            });

            await tx.payment.updateMany({
              where: { id: refund.paymentId, status: PaymentStatus.SUCCESS },
              data: { status: PaymentStatus.REFUNDED },
            });

            return current;
          });

          return {
            success: true,
            message: 'Refund reconciled from the Razorpay payment record.',
            data: serializePrisma(updated),
          };
        } catch (error: any) {
          if (
            error instanceof BadRequestException ||
            error instanceof NotFoundException
          ) {
            throw error;
          }
          throw new ServiceUnavailableException(
            'Unable to fetch the Razorpay payment right now. No new refund will be created.',
          );
        }
      }

      if (
        gatewayRefund?.payment_id !== refund.payment.razorpayPaymentId ||
        gatewayRefund?.currency !== refund.currency ||
        gatewayRefund?.amount !== toPaise(refund.amount)
      ) {
        throw new BadRequestException(
          'Razorpay refund details do not match the local refund. Manual reconciliation is required.',
        );
      }

      const status = gatewayRefund?.status;
      if (status === 'failed') {
        const updated = await this.prisma.paymentRefund.update({
          where: { id: refund.id },
          data: {
            status: 'FAILED',
            activeKey: null,
            failureReason: gatewayRefund?.error_description?.slice(0, 1000) || 'Razorpay refund failed.',
          },
        });
        return { success: true, message: 'Refund failure reconciled.', data: serializePrisma(updated) };
      }

      if (status !== 'processed') {
        return {
          success: true,
          message: 'Refund is still pending at Razorpay. No new refund was created.',
          data: serializePrisma(refund),
        };
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const current = await tx.paymentRefund.update({
          where: { id: refund.id },
          data: { status: 'PROCESSED', activeKey: null, processedAt: new Date(), failureReason: null },
        });

        await tx.payment.updateMany({
          where: { id: refund.paymentId, status: PaymentStatus.SUCCESS },
          data: { status: PaymentStatus.REFUNDED },
        });

        return current;
      });

      return {
        success: true,
        message: 'Refund reconciled with Razorpay.',
        data: serializePrisma(updated),
      };
    }

    private async reconcileRefundWebhook(
      razorpayRefundId: string,
      eventType: string,
      razorpayPaymentId: string | undefined,
      amount: number | undefined,
      currency: string | undefined,
      razorpayStatus: string | undefined,
      failureReason: string | undefined,
    ) {
      let refund = await this.prisma.paymentRefund.findFirst({
        where: {
          razorpayRefundId,
          ...(razorpayPaymentId
            ? { payment: { razorpayPaymentId } }
            : {}),
        },
        include: { payment: true },
      });

      if (!refund && razorpayPaymentId) {
        refund = await this.prisma.paymentRefund.findFirst({
          where: {
            payment: { razorpayPaymentId },
            status: { in: ['PENDING', 'UNKNOWN'] },
          },
          orderBy: { createdAt: 'desc' },
          include: { payment: true },
        });

        if (refund) {
          refund = await this.prisma.paymentRefund.update({
            where: { id: refund.id },
            data: { razorpayRefundId },
            include: { payment: true },
          });
        }
      }

      if (!refund) return;

      const expectedAmountInPaise = toPaise(refund.amount);
      if (
        !Number.isSafeInteger(expectedAmountInPaise) ||
        amount !== undefined && amount !== expectedAmountInPaise ||
        currency !== undefined && currency !== refund.currency
      ) {
        throw new BadRequestException('Razorpay refund details failed reconciliation.');
      }

      const processed =
        eventType === 'refund.processed' ||
        razorpayStatus === 'processed';
      const failed = eventType === 'refund.failed' || razorpayStatus === 'failed';

      if (failed) {
        await this.prisma.paymentRefund.update({
          where: { id: refund.id },
          data: {
            status: 'FAILED',
            activeKey: null,
            failureReason: failureReason?.slice(0, 1000) || 'Razorpay refund failed.',
          },
        });
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentRefund.update({
          where: { id: refund.id },
          data: {
            status: processed ? 'PROCESSED' : 'PENDING',
            activeKey: processed ? null : refund.paymentId, 
            processedAt: processed ? new Date() : null,
            failureReason: null,
          },
        });

        if (processed) {
          const processedRefunds = await tx.paymentRefund.aggregate({
            where: {
              paymentId: refund.paymentId,
              status: 'PROCESSED',
            },
            _sum: { amount: true },
          });
          const totalRefunded = new Prisma.Decimal(
            processedRefunds._sum.amount ?? 0,
          );
          if (totalRefunded.gte(new Prisma.Decimal(refund.payment.amount))) {
            await tx.payment.updateMany({
              where: { id: refund.paymentId, status: PaymentStatus.SUCCESS },
              data: { status: PaymentStatus.REFUNDED },
            });
          }
        }
      });
    }

    private async reconcileFailedPayment(
      razorpayOrderId: string,
      razorpayPaymentId: string | undefined,
      reason: string,
    ) {
      const payment = await this.prisma.payment.findUnique({
        where: { razorpayOrderId },
      });

      if (!payment || payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.REFUNDED) {
        return;
      }

      if (razorpayPaymentId && payment.razorpayPaymentId && payment.razorpayPaymentId !== razorpayPaymentId) {
        return;
      }

      await this.prisma.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] },
        },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: reason.slice(0, 500),
        },
      });
    }

    private async sendPaymentSuccessNotifications(payment: any) {
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
          paymentId: payment.id,
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
          paymentId: payment.id,
          bookingId: payment.bookingId,
          propertyId: payment.booking.propertyId,
        },
      );
    }

    async reconcilePaymentState(paymentId: string, user: any) {
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can reconcile payment state.');
      }

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: { include: { property: true } },
          invoices: true,
          refunds: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!payment) throw new NotFoundException('Payment not found.');

      const totalProcessedRefund = payment.refunds
        .filter((refund: any) => refund.status === 'PROCESSED')
        .reduce(
          (total: Prisma.Decimal, refund: any) =>
            total.add(new Prisma.Decimal(refund.amount)),
          new Prisma.Decimal(0),
        );
      const latestActiveRefund = payment.refunds.find(
        (refund: any) => refund.status === 'PENDING' || refund.status === 'UNKNOWN',
      );
      const invoice = payment.invoices.find(
        (item: any) => item.paymentId === payment.id,
      );

      const checks = {
        paymentHasBooking: payment.bookingId === payment.booking.id,
        bookingMatchesPaymentState:
          payment.status === PaymentStatus.SUCCESS ||
          payment.status === PaymentStatus.REFUNDED
            ? payment.booking.status === BookingStatus.PAID
            : true,
        paymentHasInvoice:
          payment.status === PaymentStatus.SUCCESS ||
          payment.status === PaymentStatus.REFUNDED
            ? Boolean(invoice)
            : true,
        invoiceAmountMatches:
          !invoice ||
          (new Prisma.Decimal(invoice.amount).eq(new Prisma.Decimal(payment.amount)) &&
            new Prisma.Decimal(invoice.totalAmount).eq(new Prisma.Decimal(payment.amount)) &&
            invoice.currency === payment.currency),
        propertyAvailabilityMatchesPayment:
          payment.status === PaymentStatus.SUCCESS ||
          payment.status === PaymentStatus.REFUNDED
            ? payment.booking.property.isAvailable === false
            : true,
        fullRefundMatchesPayment:
          payment.status === PaymentStatus.REFUNDED
            ? totalProcessedRefund.gte(new Prisma.Decimal(payment.amount))
            : true,
        noUnreconciledRefund:
          payment.status === PaymentStatus.REFUNDED
            ? !latestActiveRefund
            : true,
      };

      const consistent = Object.values(checks).every(Boolean);

      return {
        success: true,
        data: serializePrisma({
          paymentId: payment.id,
          status: payment.status,
          bookingId: payment.bookingId,
          invoiceId: invoice?.id ?? null,
          refundId:
            payment.refunds.find((refund: any) => refund.status === 'PROCESSED')?.id ??
            null,
          totalProcessedRefund,
          activeRefundId: latestActiveRefund?.id ?? null,
          consistent,
          checks,
        }),
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
