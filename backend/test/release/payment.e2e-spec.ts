import request from 'supertest';
import { createHmac } from 'crypto';
import { describe, expect, it } from '@jest/globals';

import {
  apiUrl,
  auth,
  extractData,
  futureIso,
  login,
  statusOk,
} from './helpers';

describe('Release E2E • Payment', () => {
  let tenantToken = '';
  let ownerToken = '';
  let bookingId = '';
  let visitId = '';
  let paymentId = '';
  let razorpayOrderId = '';

  const propertyId = process.env.E2E_PROPERTY_ID!;

  it('1. tenant + owner login', async () => {
    const tenant = await login(
      process.env.E2E_TENANT_EMAIL!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    const owner = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );

    tenantToken = tenant.token;
    ownerToken = owner.token;

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
  });

  it('2. create/reuse booking ready for payment', async () => {
    const bookingsRes = await request(apiUrl())
      .get('/bookings/tenant')
      .set(auth(tenantToken))
      .expect(200);

    const bookingData = extractData(bookingsRes.body);

    const bookings = Array.isArray(bookingData)
      ? bookingData
      : (bookingData?.bookings ?? bookingsRes.body?.bookings ?? []);

    const existingBooking = bookings.find(
      (booking: any) =>
        booking.propertyId === propertyId &&
        ['APPROVED', 'PAYMENT_PENDING'].includes(booking.status),
    );

    if (existingBooking?.id) {
      bookingId = existingBooking.id;

      // If already payment pending, we are ready.
      if (existingBooking.status === 'PAYMENT_PENDING') {
        process.env.E2E_BOOKING_ID = bookingId;
        expect(bookingId).toBeTruthy();
        return;
      }

      // APPROVED → PAYMENT_PENDING
      const paymentPending = await request(apiUrl())
        .patch(`/bookings/${bookingId}/payment-pending`)
        .set(auth(tenantToken));

      statusOk(paymentPending);

      expect(extractData(paymentPending.body)?.status).toBe('PAYMENT_PENDING');

      process.env.E2E_BOOKING_ID = bookingId;
      return;
    }

    // No reusable booking → create a new visit + booking.
    const visit = await request(apiUrl())
      .post('/property-visits')
      .set(auth(tenantToken))
      .send({
        propertyId,
        visitDate: futureIso(45),
        notes: 'RentItEase release Payment E2E',
      });

    statusOk(visit);

    visitId = extractData(visit.body)?.id;
    expect(visitId).toBeTruthy();

    const approveVisit = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveVisit);

    expect(extractData(approveVisit.body)?.status).toBe('APPROVED');

    const booking = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({
        visitId,
        notes: 'RentItEase release Payment E2E',
      });

    statusOk(booking);

    bookingId = extractData(booking.body)?.id;
    expect(bookingId).toBeTruthy();

    const approveBooking = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveBooking);

    expect(extractData(approveBooking.body)?.status).toBe('APPROVED');

    const paymentPending = await request(apiUrl())
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set(auth(tenantToken));

    statusOk(paymentPending);

    expect(extractData(paymentPending.body)?.status).toBe('PAYMENT_PENDING');

    process.env.E2E_BOOKING_ID = bookingId;
  });
  
  it('3. create/reuse Razorpay order', async () => {
    const res = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({ bookingId });

    statusOk(res);

    const data = extractData(res.body);

    paymentId = data?.paymentId ?? data?.payment?.id;
    razorpayOrderId = data?.razorpayOrderId;

    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();
  });

  it('4. verify Razorpay signature → PAID', async () => {
    const secret = process.env.E2E_RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error('E2E_RAZORPAY_KEY_SECRET is required.');
    }

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

    expect(extractData(booking.body)?.id).toBe(bookingId);
    expect(extractData(booking.body)?.status).toBe('PAID');
  });
});
