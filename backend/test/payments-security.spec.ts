import { BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaymentStatus, BookingStatus, UserRole } from '@prisma/client';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('PaymentsService Razorpay security', () => {
  const prisma: any = {
    payment: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    booking: { updateMany: jest.fn() },
    property: { updateMany: jest.fn() },
    invoice: { upsert: jest.fn() },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  };
  const notifications: any = { createNotification: jest.fn() };
  const push: any = { sendToUser: jest.fn() };
  let service: PaymentsService;

  const paymentRecord = () => ({
    id: 'payment_1234567890',
    bookingId: 'booking_1234567890',
    amount: 1000,
    currency: 'INR',
    status: PaymentStatus.CREATED,
    razorpayOrderId: 'order_1234567890',
    razorpayPaymentId: null,
    razorpaySignature: null,
    booking: {
      id: 'booking_1234567890',
      status: BookingStatus.PAYMENT_PENDING,
      tenantId: 'tenant_123456',
      propertyId: 'property_123456',
      property: {
        id: 'property_123456',
        title: 'Test Property',
        ownerId: 'owner_123456',
        isAvailable: true,
      },
      tenant: {
        id: 'tenant_123456',
        fullName: 'Tenant',
        email: 'tenant@example.com',
        phone: '+919999999999',
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    service = new PaymentsService(prisma, notifications, push);
    (service as any).razorpay = {
      orders: { fetch: jest.fn() },
      payments: { fetch: jest.fn() },
    };
    prisma.payment.findUnique.mockResolvedValue(paymentRecord());
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });
    prisma.property.updateMany.mockResolvedValue({ count: 1 });
    prisma.invoice.upsert.mockResolvedValue({ id: 'invoice_123456' });
    prisma.payment.findUnique.mockImplementation(async () => paymentRecord());
  });

  function signature(orderId = 'order_1234567890', paymentId = 'pay_1234567890') {
    return createHmac('sha256', 'test_secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  it('does not mutate the payment when the checkout signature is invalid', async () => {
    await expect(
      service.verifyPayment(
        {
          bookingId: 'booking_1234567890',
          razorpayOrderId: 'order_1234567890',
          razorpayPaymentId: 'pay_1234567890',
          razorpaySignature: '0'.repeat(64),
        },
        { id: 'tenant_123456', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
    expect(prisma.property.updateMany).not.toHaveBeenCalled();
    expect(prisma.invoice.upsert).not.toHaveBeenCalled();
    expect((service as any).razorpay.payments.fetch).not.toHaveBeenCalled();
  });

  it('rejects a gateway amount mismatch before changing local payment state', async () => {
    (service as any).razorpay.orders.fetch.mockResolvedValue({
      id: 'order_1234567890',
      amount: 99900,
      currency: 'INR',
    });
    (service as any).razorpay.payments.fetch.mockResolvedValue({
      id: 'pay_1234567890',
      order_id: 'order_1234567890',
      amount: 99900,
      currency: 'INR',
      status: 'captured',
    });

    await expect(
      service.verifyPayment(
        {
          bookingId: 'booking_1234567890',
          razorpayOrderId: 'order_1234567890',
          razorpayPaymentId: 'pay_1234567890',
          razorpaySignature: signature(),
        },
        { id: 'tenant_123456', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
    expect(prisma.property.updateMany).not.toHaveBeenCalled();
  });

  it('requires a captured gateway payment and matching trusted order/payment IDs', async () => {
    (service as any).razorpay.orders.fetch.mockResolvedValue({
      id: 'order_1234567890',
      amount: 100000,
      currency: 'INR',
    });
    (service as any).razorpay.payments.fetch.mockResolvedValue({
      id: 'pay_1234567890',
      order_id: 'order_other',
      amount: 100000,
      currency: 'INR',
      status: 'authorized',
    });

    await expect(
      service.verifyPayment(
        {
          bookingId: 'booking_1234567890',
          razorpayOrderId: 'order_1234567890',
          razorpayPaymentId: 'pay_1234567890',
          razorpaySignature: signature(),
        },
        { id: 'tenant_123456', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
  });

  it('makes the success transition idempotent and retries serialization failures', async () => {
    let attempts = 0;
    prisma.$transaction.mockImplementation(async (callback: any) => {
      attempts += 1;
      if (attempts === 1) {
        const error: any = new Error('serialization conflict');
        error.code = 'P2034';
        throw error;
      }
      return callback(prisma);
    });
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });

    (service as any).razorpay.orders.fetch.mockResolvedValue({
      id: 'order_1234567890',
      amount: 100000,
      currency: 'INR',
    });
    (service as any).razorpay.payments.fetch.mockResolvedValue({
      id: 'pay_1234567890',
      order_id: 'order_1234567890',
      amount: 100000,
      currency: 'INR',
      status: 'captured',
    });

    const result = await service.verifyPayment(
      {
        bookingId: 'booking_1234567890',
        razorpayOrderId: 'order_1234567890',
        razorpayPaymentId: 'pay_1234567890',
        razorpaySignature: signature(),
      },
      { id: 'tenant_123456', role: UserRole.USER },
    );

    expect(result.success).toBe(true);
    expect(attempts).toBe(2);
    expect(prisma.booking.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.property.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.invoice.upsert).toHaveBeenCalledTimes(1);
  });

  it('does not allow verification when the property became unavailable', async () => {
    const record = paymentRecord();
    record.booking.property.isAvailable = false;
    prisma.payment.findUnique.mockResolvedValue(record);

    await expect(
      service.verifyPayment(
        {
          bookingId: 'booking_1234567890',
          razorpayOrderId: 'order_1234567890',
          razorpayPaymentId: 'pay_1234567890',
          razorpaySignature: signature(),
        },
        { id: 'tenant_123456', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect((service as any).razorpay.payments.fetch).not.toHaveBeenCalled();
    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
  });
});
