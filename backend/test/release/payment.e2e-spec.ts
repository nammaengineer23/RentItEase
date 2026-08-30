import request from 'supertest';
import { createHmac } from 'crypto';
import { describe, expect, it } from '@jest/globals';

import {
  apiUrl,
  auth,
  createApprovedE2EProperty,
  extractData,
  futureIso,
  login,
  statusOk,
} from './helpers';

describe('Release E2E • Payment', () => {
  let tenantToken = '';
  let ownerToken = '';
  let adminToken = '';
  let bookingId = '';
  let visitId = '';
  let paymentId = '';
  let razorpayOrderId = '';

  let bookingStatus = '';
  let paymentStatus = '';

  let propertyId = '';

  // ============================================================
  // 1. LOGIN
  // ============================================================

  it('1. tenant + owner login', async () => {
    const tenant = await login(
      process.env.E2E_TENANT_EMAIL!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    const owner = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );
    const admin = await login(
      process.env.E2E_ADMIN_EMAIL!,
      process.env.E2E_ADMIN_PASSWORD!,
    );

    tenantToken = tenant.token;
    ownerToken = owner.token;
    adminToken = admin.token;

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    expect(adminToken).toBeTruthy();
  });

  // ============================================================
  // 2. CREATE / REUSE BOOKING READY FOR PAYMENT
  // ============================================================

  it('2. create/reuse booking ready for payment', async () => {
    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    propertyId = await createApprovedE2EProperty(
      ownerToken,
      adminToken,
      'Release Payment',
    );
    expect(propertyId).toBeTruthy();

    const bookingsRes = await request(apiUrl())
      .get('/bookings/tenant')
      .set(auth(tenantToken))
      .expect(200);

    const bookingData = extractData(bookingsRes.body);

    const bookings = Array.isArray(bookingData)
      ? bookingData
      : (bookingData?.bookings ?? bookingsRes.body?.bookings ?? []);

    // Reuse an existing booking in a payment-relevant state.
    const existingBooking = bookings.find(
      (booking: any) =>
        booking?.propertyId === propertyId &&
        ['APPROVED', 'PAYMENT_PENDING', 'PAID'].includes(booking?.status),
    );

    if (existingBooking?.id) {
      bookingId = existingBooking.id;
      bookingStatus = existingBooking.status;

      expect(bookingId).toBeTruthy();

      // Already paid.
      // Test 3 will reuse the existing payment.
      if (bookingStatus === 'PAID') {
        process.env.E2E_BOOKING_ID = bookingId;
        return;
      }

      // Already payment pending.
      if (bookingStatus === 'PAYMENT_PENDING') {
        process.env.E2E_BOOKING_ID = bookingId;
        return;
      }

      // APPROVED → PAYMENT_PENDING.
      if (bookingStatus === 'APPROVED') {
        const paymentPending = await request(apiUrl())
          .patch(`/bookings/${bookingId}/payment-pending`)
          .set(auth(tenantToken));

        statusOk(paymentPending);

        bookingStatus =
          extractData(paymentPending.body)?.status ?? bookingStatus;

        expect(bookingStatus).toBe('PAYMENT_PENDING');

        process.env.E2E_BOOKING_ID = bookingId;
        return;
      }
    }

    // No reusable booking.
    // Create visit → approve visit → create booking
    // → approve booking → payment pending.

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

    bookingStatus = extractData(paymentPending.body)?.status ?? '';

    expect(bookingStatus).toBe('PAYMENT_PENDING');

    process.env.E2E_BOOKING_ID = bookingId;
  });

  // ============================================================
  // 3. CREATE / REUSE RAZORPAY PAYMENT ORDER
  // ============================================================

  it('3. create/reuse Razorpay order', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    // Always retrieve the latest booking.
    // BookingService.findOne() includes payment: true.
    const bookingRes = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    const booking = extractData(bookingRes.body);

    expect(booking).toBeTruthy();

    bookingStatus = booking?.status ?? '';

    expect(bookingStatus).toBeTruthy();

    const existingPayment = booking?.payment;

    // Already PAID.
    // Reuse the successful payment instead of calling /payments/order.
    if (bookingStatus === 'PAID') {
      expect(existingPayment).toBeTruthy();

      paymentId = existingPayment?.id ?? '';
      razorpayOrderId = existingPayment?.razorpayOrderId ?? '';
      paymentStatus = existingPayment?.status ?? '';

      expect(paymentId).toBeTruthy();
      expect(razorpayOrderId).toBeTruthy();
      expect(paymentStatus).toBe('SUCCESS');

      return;
    }

    // Only these states are valid for creating/reusing payment.
    if (bookingStatus !== 'PAYMENT_PENDING' && bookingStatus !== 'APPROVED') {
      throw new Error(
        `Booking ${bookingId} is in unsupported status: ${bookingStatus}`,
      );
    }

    // APPROVED → PAYMENT_PENDING.
    if (bookingStatus === 'APPROVED') {
      const paymentPending = await request(apiUrl())
        .patch(`/bookings/${bookingId}/payment-pending`)
        .set(auth(tenantToken));

      statusOk(paymentPending);

      bookingStatus = extractData(paymentPending.body)?.status ?? bookingStatus;

      expect(bookingStatus).toBe('PAYMENT_PENDING');
    }

    // Reuse an existing payment/order when available.
    if (
      existingPayment &&
      existingPayment.status !== 'FAILED' &&
      existingPayment.status !== 'REFUNDED'
    ) {
      paymentId = existingPayment.id ?? '';
      razorpayOrderId = existingPayment.razorpayOrderId ?? '';
      paymentStatus = existingPayment.status ?? '';

      expect(paymentId).toBeTruthy();
      expect(razorpayOrderId).toBeTruthy();

      return;
    }

    // Create a new Razorpay order.
    const res = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({
        bookingId,
      });

    statusOk(res);

    const data = extractData(res.body);

    paymentId = data?.paymentId ?? data?.payment?.id ?? '';

    razorpayOrderId =
      data?.razorpayOrderId ?? data?.payment?.razorpayOrderId ?? '';

    paymentStatus = data?.status ?? data?.payment?.status ?? '';

    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();
  });

  // ============================================================
  // 4. VERIFY RAZORPAY SIGNATURE → PAID
  // ============================================================

  it('4. verify Razorpay signature → PAID', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();
    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();

    // Already PAID.
    // Confirm the persisted state instead of verifying twice.
    if (bookingStatus === 'PAID') {
      expect(paymentStatus).toBe('SUCCESS');

      const booking = await request(apiUrl())
        .get(`/bookings/${bookingId}`)
        .set(auth(tenantToken))
        .expect(200);

      const bookingData = extractData(booking.body);

      expect(bookingData?.id).toBe(bookingId);
      expect(bookingData?.status).toBe('PAID');
      expect(bookingData?.payment?.id).toBe(paymentId);
      expect(bookingData?.payment?.status).toBe('SUCCESS');

      return;
    }

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

    const paymentData = extractData(res.body);

    expect(paymentData?.status).toBe('SUCCESS');

    paymentStatus = 'SUCCESS';
    bookingStatus = 'PAID';

    // Confirm persisted booking/payment state.
    const booking = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    const bookingData = extractData(booking.body);

    expect(bookingData?.id).toBe(bookingId);
    expect(bookingData?.status).toBe('PAID');

    expect(bookingData?.payment?.id).toBe(paymentId);
    expect(bookingData?.payment?.status).toBe('SUCCESS');
  });
});
