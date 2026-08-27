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

describe('Release E2E • Invoice', () => {
  let tenantToken = '';
  let ownerToken = '';

  let tenantId = '';
  let bookingId = '';
  let visitId = '';

  let paymentId = '';
  let razorpayOrderId = '';
  let paymentStatus = '';
  let bookingStatus = '';

  const propertyId = process.env.E2E_PROPERTY_ID;

  // ============================================================
  // 1. LOGIN
  // ============================================================

  it('1. login tenant + owner', async () => {
    expect(propertyId).toBeTruthy();

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

    const tenantData = extractData(tenant.body);

    tenantId = tenantData?.user?.id ?? tenantData?.id ?? '';

    expect(tenantId).toBeTruthy();
  });

  // ============================================================
  // 2. CREATE / REUSE BOOKING
  // ============================================================

  it('2. create/reuse booking', async () => {
    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const bookingsRes = await request(apiUrl())
      .get('/bookings/tenant')
      .set(auth(tenantToken))
      .expect(200);

    const bookingData = extractData(bookingsRes.body);

    const bookings = Array.isArray(bookingData)
      ? bookingData
      : (bookingData?.bookings ?? bookingsRes.body?.bookings ?? []);

    const reusable = bookings.find(
      (booking: any) =>
        booking?.propertyId === propertyId &&
        ['APPROVED', 'PAYMENT_PENDING', 'PAID'].includes(booking?.status),
    );

    // ----------------------------------------------------------
    // Reuse existing booking
    // ----------------------------------------------------------

    if (reusable?.id) {
      bookingId = reusable.id;
      bookingStatus = reusable.status;

      expect(bookingId).toBeTruthy();

      // PAID is valid.
      // The payment will be reused in step 3.
      if (bookingStatus === 'PAID') {
        return;
      }

      // Existing payment-pending booking is also valid.
      if (bookingStatus === 'PAYMENT_PENDING') {
        return;
      }

      // APPROVED → PAYMENT_PENDING
      if (bookingStatus === 'APPROVED') {
        const paymentPending = await request(apiUrl())
          .patch(`/bookings/${bookingId}/payment-pending`)
          .set(auth(tenantToken));

        statusOk(paymentPending);

        bookingStatus =
          extractData(paymentPending.body)?.status ?? bookingStatus;

        expect(bookingStatus).toBe('PAYMENT_PENDING');

        return;
      }
    }

    // ==========================================================
    // No reusable booking
    // Create visit → approve → booking → approve
    // ==========================================================

    const visit = await request(apiUrl())
      .post('/property-visits')
      .set(auth(tenantToken))
      .send({
        propertyId,
        visitDate: futureIso(45),
        notes: 'RentItEase release Invoice E2E',
      });

    statusOk(visit);

    const visitData = extractData(visit.body);

    visitId = visitData?.id ?? visitData?.visit?.id ?? '';

    expect(visitId).toBeTruthy();

    // ----------------------------------------------------------
    // Approve visit
    // ----------------------------------------------------------

    const approveVisit = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveVisit);

    expect(extractData(approveVisit.body)?.status).toBe('APPROVED');

    // ----------------------------------------------------------
    // Create booking
    // ----------------------------------------------------------

    const booking = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({
        visitId,
        notes: 'RentItEase release Invoice E2E',
      });

    statusOk(booking);

    const createdBooking = extractData(booking.body);

    bookingId = createdBooking?.id ?? createdBooking?.booking?.id ?? '';

    expect(bookingId).toBeTruthy();

    // ----------------------------------------------------------
    // Owner approves booking
    // ----------------------------------------------------------

    const approveBooking = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveBooking);

    bookingStatus = extractData(approveBooking.body)?.status ?? 'APPROVED';

    expect(bookingStatus).toBe('APPROVED');

    // ----------------------------------------------------------
    // APPROVED → PAYMENT_PENDING
    // ----------------------------------------------------------

    const paymentPending = await request(apiUrl())
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set(auth(tenantToken));

    statusOk(paymentPending);

    bookingStatus = extractData(paymentPending.body)?.status ?? bookingStatus;

    expect(bookingStatus).toBe('PAYMENT_PENDING');
  });

  // ============================================================
  // 3. REUSE EXISTING PAYMENT OR CREATE PAYMENT
  // ============================================================

  it('3. create/reuse Razorpay payment', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    // ----------------------------------------------------------
    // Get latest booking.
    //
    // BookingService.findOne() includes:
    // payment: true
    // ----------------------------------------------------------

    const bookingRes = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    const booking = extractData(bookingRes.body);

    expect(booking).toBeTruthy();

    bookingStatus = booking?.status ?? '';

    expect(bookingStatus).toBeTruthy();

    const existingPayment = booking?.payment;

    // ----------------------------------------------------------
    // PAID booking
    //
    // IMPORTANT:
    // Do NOT call /payments/order for PAID booking.
    // Reuse its successful payment.
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // PAYMENT_PENDING / APPROVED
    // ----------------------------------------------------------

    if (bookingStatus !== 'PAYMENT_PENDING' && bookingStatus !== 'APPROVED') {
      throw new Error(
        `Booking ${bookingId} is in unsupported status: ${bookingStatus}`,
      );
    }

    // APPROVED → PAYMENT_PENDING
    if (bookingStatus === 'APPROVED') {
      const paymentPending = await request(apiUrl())
        .patch(`/bookings/${bookingId}/payment-pending`)
        .set(auth(tenantToken));

      statusOk(paymentPending);

      bookingStatus = extractData(paymentPending.body)?.status ?? bookingStatus;

      expect(bookingStatus).toBe('PAYMENT_PENDING');
    }

    // ----------------------------------------------------------
    // Create/reuse Razorpay order
    // ----------------------------------------------------------

    const order = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({
        bookingId,
      });

    statusOk(order);

    const data = extractData(order.body);

    paymentId = data?.paymentId ?? data?.payment?.id ?? '';

    razorpayOrderId =
      data?.razorpayOrderId ?? data?.payment?.razorpayOrderId ?? '';

    paymentStatus = data?.status ?? data?.payment?.status ?? '';

    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();

    if (paymentStatus) {
      expect(['CREATED', 'PENDING'].includes(paymentStatus)).toBe(true);
    }
  });

  // ============================================================
  // 4. VERIFY PAYMENT IF NOT ALREADY PAID
  // ============================================================

  it('4. verify payment → PAID', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    // ----------------------------------------------------------
    // Existing PAID booking
    //
    // Payment was already successfully verified.
    // There is nothing to verify again.
    // ----------------------------------------------------------

    if (bookingStatus === 'PAID') {
      expect(paymentId).toBeTruthy();
      expect(paymentStatus).toBe('SUCCESS');

      const booking = await request(apiUrl())
        .get(`/bookings/${bookingId}`)
        .set(auth(tenantToken))
        .expect(200);

      const data = extractData(booking.body);

      expect(data?.id).toBe(bookingId);
      expect(data?.status).toBe('PAID');

      return;
    }

    // ----------------------------------------------------------
    // New payment verification
    // ----------------------------------------------------------

    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();

    const secret =
      process.env.E2E_RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error(
        'E2E_RAZORPAY_KEY_SECRET or RAZORPAY_KEY_SECRET is required.',
      );
    }

    const razorpayPaymentId =
      process.env.E2E_RAZORPAY_PAYMENT_ID ?? `pay_invoice_e2e_${Date.now()}`;

    const signature = createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const verify = await request(apiUrl())
      .post('/payments/verify')
      .set(auth(tenantToken))
      .send({
        bookingId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
      });

    statusOk(verify);

    const verifyData = extractData(verify.body);

    expect(verifyData?.status).toBe('SUCCESS');

    paymentStatus = 'SUCCESS';

    // ----------------------------------------------------------
    // Confirm booking is PAID
    // ----------------------------------------------------------

    const booking = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    const updatedBooking = extractData(booking.body);

    expect(updatedBooking?.id).toBe(bookingId);
    expect(updatedBooking?.status).toBe('PAID');

    bookingStatus = 'PAID';
  });

  // ============================================================
  // 5. CREATE / REUSE / VIEW / HISTORY / MARK PAID INVOICE
  // ============================================================

  it('5. create/reuse invoice → view → history → paid', async () => {
    expect(tenantToken).toBeTruthy();
    expect(tenantId).toBeTruthy();
    expect(paymentId).toBeTruthy();

    // ----------------------------------------------------------
    // Try creating invoice
    // ----------------------------------------------------------

    const create = await request(apiUrl()).post('/invoices').send({
      .set(auth(tenantToken))
      userId: tenantId,
      paymentId,
      amount: 1000,
      taxAmount: 0,
      description: 'RentItEase E2E invoice',
      currency: 'INR',
    });

    let invoiceId = '';

    // ----------------------------------------------------------
    // Existing invoice
    // ----------------------------------------------------------

    if (create.status === 400) {
      const message = create.body?.message ?? create.body?.error?.message ?? '';

      if (
        !String(message).includes('An invoice already exists for this payment')
      ) {
        throw new Error(
          `Invoice creation failed: ${JSON.stringify(create.body)}`,
        );
      }

      const existing = await request(apiUrl())
        .get(`/invoices/payment/${paymentId}`)
      .set(auth(tenantToken))
        .expect(200);

      const existingInvoice = extractData(existing.body);

      expect(existingInvoice).toBeTruthy();

      invoiceId = existingInvoice?.id ?? '';

      expect(invoiceId).toBeTruthy();
    } else {
      statusOk(create);

      const invoice = extractData(create.body);

      invoiceId = invoice?.id ?? '';

      expect(invoiceId).toBeTruthy();
      expect(invoice?.invoiceNumber).toBeTruthy();
    }

    // ----------------------------------------------------------
    // View invoice
    // ----------------------------------------------------------

    const view = await request(apiUrl())
      .get(`/invoices/${invoiceId}`)
      .set(auth(tenantToken))
      .expect(200);

    const viewedInvoice = extractData(view.body);

    expect(viewedInvoice?.id).toBe(invoiceId);

    // ----------------------------------------------------------
    // Invoice history
    // ----------------------------------------------------------

    const history = await request(apiUrl())
      .get(`/invoices/user/${tenantId}`)
      .set(auth(tenantToken))
      .expect(200);

    expect(JSON.stringify(history.body)).toContain(invoiceId);

    // ----------------------------------------------------------
    // Find invoice by payment
    // ----------------------------------------------------------

    const byPayment = await request(apiUrl())
      .get(`/invoices/payment/${paymentId}`)
      .set(auth(tenantToken))
      .expect(200);

    const paymentInvoice = extractData(byPayment.body);

    expect(paymentInvoice?.id).toBe(invoiceId);

    // ----------------------------------------------------------
    // Mark invoice paid
    //
    // If already PAID, the endpoint is still safe to call.
    // ----------------------------------------------------------

    const paid = await request(apiUrl()).patch(`/invoices/${invoiceId}/paid`);
      .set(auth(tenantToken))

    statusOk(paid);

    const paidInvoice = extractData(paid.body);

    expect(paidInvoice?.status).toBe('PAID');
  });
});
