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
  let bookingId = '';
  let visitId = '';
  let paymentId = '';
  let razorpayOrderId = '';

  const propertyId = process.env.E2E_PROPERTY_ID!;

  it('1. login tenant + owner', async () => {
    const tenant = await login(
      process.env.E2E_TENANT_LOGIN!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    const owner = await login(
      process.env.E2E_OWNER_LOGIN!,
      process.env.E2E_OWNER_PASSWORD!,
    );

    tenantToken = tenant.token;
    ownerToken = owner.token;

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
  });

  it('2. create/reuse approved booking', async () => {
    const visits = await request(apiUrl())
      .get('/property-visits/tenant')
      .set(auth(tenantToken))
      .expect(200);

    const visitData = extractData(visits.body);

    const visitList = Array.isArray(visitData)
      ? visitData
      : (visitData?.visits ?? visits.body?.visits ?? []);

    const approvedVisit = visitList.find(
      (visit: any) =>
        visit.propertyId === propertyId &&
        visit.status === 'APPROVED' &&
        !visit.booking,
    );

    if (approvedVisit?.id) {
      visitId = approvedVisit.id;
    } else {
      const visit = await request(apiUrl())
        .post('/property-visits')
        .set(auth(tenantToken))
        .send({
          propertyId,
          visitDate: futureIso(45),
          notes: 'RentItEase release Invoice E2E',
        });

      statusOk(visit);

      const visitDataCreated = extractData(visit.body);
      visitId = visitDataCreated?.id ?? visitDataCreated?.visit?.id;

      expect(visitId).toBeTruthy();

      const approveVisit = await request(apiUrl())
        .patch(`/property-visits/${visitId}/approve`)
        .set(auth(ownerToken));

      statusOk(approveVisit);

      expect(extractData(approveVisit.body)?.status).toBe('APPROVED');
    }

    const booking = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({
        visitId,
        notes: 'RentItEase release Invoice E2E',
      });

    if (booking.status === 400) {
      const message =
        booking.body?.error?.message ?? booking.body?.message ?? '';

      if (!message.includes('active booking')) {
        throw new Error(
          `Booking creation failed: ${JSON.stringify(booking.body)}`,
        );
      }

      // Find the tenant's existing booking for this property.
      const existing = await request(apiUrl())
        .get('/bookings/tenant')
        .set(auth(tenantToken))
        .expect(200);

      const existingData = extractData(existing.body);

      const bookings = Array.isArray(existingData)
        ? existingData
        : (existingData?.bookings ?? existing.body?.bookings ?? []);

      const reusable = bookings.find(
        (item: any) =>
          item.propertyId === propertyId &&
          ['APPROVED', 'PAYMENT_PENDING', 'PAID'].includes(item.status),
      );

      if (!reusable?.id) {
        throw new Error(
          'Tenant has an active booking, but it could not be located for reuse.',
        );
      }

      bookingId = reusable.id;
    } else {
      statusOk(booking);

      const bookingData = extractData(booking.body);
      bookingId = bookingData?.id ?? bookingData?.booking?.id;

      expect(bookingId).toBeTruthy();

      const approveBooking = await request(apiUrl())
        .patch(`/bookings/${bookingId}/approve`)
        .set(auth(ownerToken));

      statusOk(approveBooking);

      expect(extractData(approveBooking.body)?.status).toBe('APPROVED');
    }

    expect(bookingId).toBeTruthy();
  });

  it('3. create/reuse Razorpay payment order', async () => {
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

  it('4. verify payment → PAID', async () => {
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

  it('5. create invoice → view → history → paid', async () => {
    const tenant = await login(
      process.env.E2E_TENANT_LOGIN!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    const tenantData = extractData(tenant.body);

    const userId = tenantData?.user?.id ?? tenantData?.id;

    expect(userId).toBeTruthy();
    expect(paymentId).toBeTruthy();

    const create = await request(apiUrl()).post('/invoices').send({
      userId,
      paymentId,
      amount: 1000,
      taxAmount: 0,
      description: 'RentItEase E2E invoice',
      currency: 'INR',
    });

    statusOk(create);

    const invoice = extractData(create.body);

    const invoiceId = invoice?.id;
    const invoiceNumber = invoice?.invoiceNumber;

    expect(invoiceId).toBeTruthy();
    expect(invoiceNumber).toBeTruthy();

    const view = await request(apiUrl())
      .get(`/invoices/${invoiceId}`)
      .expect(200);

    expect(extractData(view.body)?.id).toBe(invoiceId);

    const history = await request(apiUrl())
      .get(`/invoices/user/${userId}`)
      .expect(200);

    expect(JSON.stringify(history.body)).toContain(invoiceId);

    const byPayment = await request(apiUrl())
      .get(`/invoices/payment/${paymentId}`)
      .expect(200);

    expect(JSON.stringify(byPayment.body)).toContain(invoiceId);

    const paid = await request(apiUrl()).patch(`/invoices/${invoiceId}/paid`);

    statusOk(paid);

    expect(extractData(paid.body)?.status).toBe('PAID');
  });
});
