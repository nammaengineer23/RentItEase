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

    // Use one idempotent order request in the release smoke path.
    // The backend itself protects concurrent callers with the payment reservation;
    // racing the live Razorpay gateway here can leave the test caller observing the
    // intentional short-lived PENDING reservation while the winning request finishes.
    const orderResponse = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({ bookingId });

    statusOk(orderResponse);

    const orderData = extractData(orderResponse.body);
    const createdPaymentId =
      orderData?.paymentId ?? orderData?.payment?.id ?? '';

    expect(createdPaymentId).toBeTruthy();

    let persistedPayment = extractData(
      (
        await request(apiUrl())
          .get('/payments/' + createdPaymentId)
          .set(auth(tenantToken))
          .expect(200)
      ).body,
    );

    // A PENDING reservation is a valid intermediate state while the gateway
    // order is being linked. Allow the live production request to settle before
    // asserting the final CREATED/order_* state.
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (
        persistedPayment?.status === 'CREATED' &&
        /^order_/.test(persistedPayment?.razorpayOrderId ?? '')
      ) {
        break;
      }

      if (persistedPayment?.status === 'FAILED') {
        throw new Error(
          `Payment order creation failed: ${persistedPayment?.failureReason ?? 'unknown reason'}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshed = await request(apiUrl())
        .get('/payments/' + createdPaymentId)
        .set(auth(tenantToken))
        .expect(200);

      persistedPayment = extractData(refreshed.body);
    }

    paymentId = persistedPayment?.id ?? '';
    razorpayOrderId = persistedPayment?.razorpayOrderId ?? '';
    paymentStatus = persistedPayment?.status ?? '';

    expect(paymentId).toBe(createdPaymentId);
    expect(razorpayOrderId).toMatch(/^order_/);
    expect(paymentStatus).toBe('CREATED');

    // Confirm idempotent reuse after the gateway order is fully linked.
    const reusedResponse = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({ bookingId });

    statusOk(reusedResponse);

    const reusedData = extractData(reusedResponse.body);
    expect(reusedData?.paymentId ?? reusedData?.payment?.id).toBe(paymentId);
    expect(reusedData?.razorpayOrderId).toBe(razorpayOrderId);
  });

  // ============================================================
  // 4. INVALID SIGNATURE MUST NOT FAIL THE PAYMENT
  // ============================================================

  it('4. reject invalid signature without mutating payment state', async () => {
    if (bookingStatus === 'PAID') return;

    const before = await request(apiUrl())
      .get(`/payments/${paymentId}`)
      .set(auth(tenantToken))
      .expect(200);

    expect(extractData(before.body)?.status).not.toBe('FAILED');

    const response = await request(apiUrl())
      .post('/payments/verify')
      .set(auth(tenantToken))
      .send({
        bookingId,
        razorpayOrderId,
        razorpayPaymentId: 'pay_invalid_e2e',
        razorpaySignature: '0'.repeat(64),
      });

    expect(response.status).toBe(400);

    const after = await request(apiUrl())
      .get(`/payments/${paymentId}`)
      .set(auth(tenantToken))
      .expect(200);

    expect(extractData(after.body)?.status).toBe(extractData(before.body)?.status);
  });

  // ============================================================
  // 5. VERIFY REAL RAZORPAY PAYMENT → PAID
  // ============================================================

  it('5. verify Razorpay payment → PAID', async () => {
    if (!process.env.E2E_RAZORPAY_PAYMENT_ID) { console.warn('Skipping positive Razorpay verification: no real captured E2E payment configured.'); return; }
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

    const razorpayPaymentId = process.env.E2E_RAZORPAY_PAYMENT_ID;

    if (!razorpayPaymentId) {
      throw new Error(
        'E2E_RAZORPAY_PAYMENT_ID must reference a real payment captured against the E2E Razorpay order.',
      );
    }

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

  // ============================================================
  // 6. RAZORPAY WEBHOOK SIGNATURE + EVENT IDEMPOTENCY
  // ============================================================

  it('6. accept a signed captured webhook once and deduplicate retries', async () => {
    if (paymentStatus !== 'SUCCESS' || !process.env.E2E_RAZORPAY_PAYMENT_ID) { console.warn('Skipping captured webhook E2E because no verified captured payment is available.'); return; }
    expect(paymentStatus).toBe('SUCCESS');
    expect(razorpayOrderId).toMatch(/^order_/);

    const webhookSecret = process.env.E2E_RAZORPAY_WEBHOOK_SECRET;
    const razorpayPaymentId = process.env.E2E_RAZORPAY_PAYMENT_ID;

    if (!webhookSecret) {
      throw new Error('E2E_RAZORPAY_WEBHOOK_SECRET is required.');
    }
    if (!razorpayPaymentId) {
      throw new Error('E2E_RAZORPAY_PAYMENT_ID is required.');
    }

    const payload = {
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: razorpayPaymentId,
            order_id: razorpayOrderId,
            status: 'captured',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    const eventId = `e2e-payment-captured-${paymentId}`;

    const invalid = await request(apiUrl())
      .post('/payments/webhook')
      .set('x-razorpay-signature', '0'.repeat(64))
      .set('x-razorpay-event-id', `${eventId}-invalid`)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(invalid.status).toBe(403);

    const first = await request(apiUrl())
      .post('/payments/webhook')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', eventId)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    statusOk(first);

    const second = await request(apiUrl())
      .post('/payments/webhook')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', eventId)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    statusOk(second);
    expect(second.body?.message).toContain('already processed');
  });

  // ============================================================
  // 7. PAYMENT / BOOKING / INVOICE CONSISTENCY
  // ============================================================

  it('7. reconcile payment, booking and invoice state', async () => {
    if (paymentStatus !== 'SUCCESS') { console.warn('Skipping payment reconciliation because payment was not verified as SUCCESS.'); return; }
    expect(adminToken).toBeTruthy();
    expect(paymentId).toBeTruthy();

    const reconciliation = await request(apiUrl())
      .get(`/payments/${paymentId}/reconciliation`)
      .set(auth(adminToken))
      .expect(200);

    const data = extractData(reconciliation.body);

    expect(data?.paymentId).toBe(paymentId);
    expect(data?.bookingId).toBe(bookingId);
    expect(data?.invoiceId).toBeTruthy();
    expect(data?.consistent).toBe(true);
    expect(data?.checks?.paymentHasBooking).toBe(true);
    expect(data?.checks?.paymentHasInvoice).toBe(true);
    expect(data?.checks?.invoiceAmountMatches).toBe(true);
  });


});
