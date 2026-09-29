import { ForbiddenException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('PaymentsService refund reconciliation', () => {
  const prisma: any = {
    paymentRefund: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
    paymentWebhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const notifications: any = {
    createNotification: jest.fn(),
  };
  const push: any = {
    sendToUser: jest.fn(),
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    service = new PaymentsService(prisma, notifications, push);
    (service as any).razorpay = { refunds: { fetch: jest.fn() } };
  });

  it('reconciles an UNKNOWN refund from the gateway refund record', async () => {
    const localRefund = {
      id: 'refund_1',
      paymentId: 'payment_1',
      amount: 100,
      currency: 'INR',
      status: 'UNKNOWN',
      razorpayRefundId: 'rfnd_1',
      payment: {
        id: 'payment_1',
        status: 'SUCCESS',
        razorpayPaymentId: 'pay_1',
        booking: { id: 'booking_1' },
      },
    };

    prisma.paymentRefund.findUnique.mockResolvedValue(localRefund);
    prisma.paymentRefund.update.mockResolvedValue({
      ...localRefund,
      status: 'PROCESSED',
    });
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });

    (service as any).razorpay = {
      refunds: {
        fetch: jest.fn().mockResolvedValue({
          id: 'rfnd_1',
          payment_id: 'pay_1',
          amount: 10000,
          currency: 'INR',
          status: 'processed',
        }),
      },
    };

    const result = await service.reconcileRefund('refund_1', { role: 'ADMIN' });

    expect(result.success).toBe(true);
    expect(prisma.paymentRefund.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'refund_1' },
        data: expect.objectContaining({ status: 'PROCESSED' }),
      }),
    );
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment_1', status: 'SUCCESS' },
        data: { status: 'REFUNDED' },
      }),
    );
  });

  it('does not create a second refund when the gateway still reports pending', async () => {
    const localRefund = {
      id: 'refund_2',
      paymentId: 'payment_2',
      amount: 100,
      currency: 'INR',
      status: 'UNKNOWN',
      razorpayRefundId: 'rfnd_2',
      payment: {
        id: 'payment_2',
        status: 'SUCCESS',
        razorpayPaymentId: 'pay_2',
        booking: { id: 'booking_2' },
      },
    };

    prisma.paymentRefund.findUnique.mockResolvedValue(localRefund);
    (service as any).razorpay = {
      refunds: {
        fetch: jest.fn().mockResolvedValue({
          id: 'rfnd_2',
          payment_id: 'pay_2',
          amount: 10000,
          currency: 'INR',
          status: 'pending',
        }),
      },
    };

    const result = await service.reconcileRefund('refund_2', { role: 'ADMIN' });

    expect(result.message).toContain('still pending');
    expect(prisma.paymentRefund.update).not.toHaveBeenCalled();
    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
  });

  it('rejects reconciliation by non-admin users', async () => {
    await expect(
      service.reconcileRefund('refund_3', { role: 'USER' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('PaymentsService webhook recovery', () => {
  const prisma: any = {
    paymentWebhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const notifications: any = { createNotification: jest.fn() };
  const push: any = { sendToUser: jest.fn() };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';
    service = new PaymentsService(prisma, notifications, push);
  });

  it('retries the same webhook event after a previous processing failure', async () => {
    const payload = {
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_1',
            order_id: 'order_1',
            status: 'captured',
          },
        },
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = createHmac('sha256', 'webhook_secret')
      .update(rawBody)
      .digest('hex');

    prisma.paymentWebhookEvent.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'event_1',
        eventId: 'event-1',
        status: 'FAILED',
      });

    prisma.paymentWebhookEvent.create.mockResolvedValue({
      id: 'event_1',
      eventId: 'event-1',
      status: 'RECEIVED',
    });

    prisma.paymentWebhookEvent.update.mockResolvedValue({});
    const reconcile = jest
      .spyOn(service as any, 'reconcileCapturedPayment')
      .mockRejectedValueOnce(new Error('temporary gateway failure'))
      .mockResolvedValueOnce(undefined);

    await expect(
      service.handleWebhook(rawBody, signature, 'event-1'),
    ).rejects.toThrow('temporary gateway failure');

    await service.handleWebhook(rawBody, signature, 'event-1');

    expect(reconcile).toHaveBeenCalledTimes(2);
    expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'event_1' },
        data: expect.objectContaining({ status: 'PROCESSED' }),
      }),
    );
  });

  it('does not reprocess a webhook already marked PROCESSED', async () => {
    prisma.paymentWebhookEvent.findUnique.mockResolvedValue({
      id: 'event_2',
      eventId: 'event-2',
      status: 'PROCESSED',
    });

    const reconcile = jest.spyOn(service as any, 'reconcileCapturedPayment');

    const result = await service.handleWebhook(
      Buffer.from('{}'),
      'ignored',
      'event-2',
    );

    expect(result.message).toContain('already processed');
    expect(reconcile).not.toHaveBeenCalled();
  });
});
