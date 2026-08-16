import request from 'supertest';
import { createHmac } from 'crypto';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, auth, extractData, login, statusOk } from './helpers';

describe('Release E2E • Payment', () => {
  let tenantToken = '';
  let bookingId = '';
  let paymentId = '';
  let razorpayOrderId = '';

  it('1. tenant login', async () => {
    tenantToken = (
      await login(process.env.E2E_TENANT_LOGIN!, process.env.E2E_TENANT_PASSWORD!)
    ).token;
    expect(tenantToken).toBeTruthy();
  });

  it('2. create/reuse Razorpay order', async () => {
    bookingId = process.env.E2E_BOOKING_ID || '';
    if (!bookingId) throw new Error('Run booking E2E first or set E2E_BOOKING_ID.');

    const res = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({ bookingId });
    statusOk(res);

    const d = extractData(res.body);
    paymentId = d?.paymentId ?? d?.payment?.id;
    razorpayOrderId = d?.razorpayOrderId;
    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();
    process.env.E2E_PAYMENT_ID = paymentId!;
  });

  it('3. verify Razorpay signature → PAID', async () => {
    const secret = process.env.E2E_RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('E2E_RAZORPAY_KEY_SECRET is required.');

    // The backend verifies orderId|paymentId using HMAC-SHA256. A synthetic
    // payment ID is sufficient for this backend contract; no real card data is used.
    const razorpayPaymentId =
      process.env.E2E_RAZORPAY_PAYMENT_ID || `pay_e2e_${Date.now()}`;
    const signature = createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const res = await request(apiUrl())
      .post('/payments/verify')
      .set(auth(tenantToken))
      .send({
        bookingId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
      });
    statusOk(res);
    expect(extractData(res.body)?.status).toBe('SUCCESS');

    const booking = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);
    expect(extractData(booking.body)?.status).toBe('PAID');
  });
});
