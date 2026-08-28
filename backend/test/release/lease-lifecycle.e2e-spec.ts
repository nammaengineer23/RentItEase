import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { createHmac } from 'crypto';

import {
  apiUrl,
  auth,
  extractData,
  futureIso,
  login,
  statusOk,
} from './helpers';

describe('Release E2E • Lease Lifecycle', () => {
  let tenantToken = '';
  let ownerToken = '';

  let propertyId = '';
  let visitId = '';
  let bookingId = '';
  let leaseId = '';

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

    tenantToken = tenant.token;
    ownerToken = owner.token;

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
  });

  // ============================================================
  // 2. CREATE FRESH PROPERTY
  // ============================================================

  it('2. owner creates fresh lifecycle E2E property', async () => {
    expect(ownerToken).toBeTruthy();

    const res = await request(apiUrl())
      .post('/properties')
      .set(auth(ownerToken))
      .send({
        title: `Release Lease Lifecycle Property ${Date.now()}`,
        description:
          'Dedicated property created automatically by the RentItEase Lease Lifecycle release E2E test.',
        price: 25000,
        address: '123 Release Lease Lifecycle Road',
        locality: 'HSR Layout',
        landmark: 'Near Lease Lifecycle Test Junction',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        pincode: '560102',
        latitude: 12.9116,
        longitude: 77.6474,
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        propertyType: 'APARTMENT',
        furnishing: 'SEMI_FURNISHED',
        parking: true,
        petFriendly: true,
        securityDeposit: 50000,
        termsAccepted: true,
        termsVersion: '1.0',
      });

    statusOk(res);

    const property =
      res.body?.property ??
      extractData(res.body)?.property ??
      extractData(res.body);

    propertyId = property?.id ?? '';

    expect(propertyId).toBeTruthy();

    console.log(`Release Lease Lifecycle property created: ${propertyId}`);
  });

  // ============================================================
  // 3. CREATE VISIT
  // ============================================================

  it('3. tenant creates visit', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const res = await request(apiUrl())
      .post('/property-visits')
      .set(auth(tenantToken))
      .send({
        propertyId,
        visitDate: futureIso(45),
        notes: 'RentItEase release Lease Lifecycle E2E',
      });

    statusOk(res);

    const visit = extractData(res.body);

    visitId = visit?.id ?? visit?.visit?.id ?? '';

    expect(visitId).toBeTruthy();

    console.log(`Release Lease Lifecycle visit created: ${visitId}`);
  });

  // ============================================================
  // 4. OWNER APPROVES VISIT
  // ============================================================

  it('4. owner approves visit', async () => {
    expect(ownerToken).toBeTruthy();
    expect(visitId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  // ============================================================
  // 5. TENANT CREATES BOOKING
  // ============================================================

  it('5. tenant creates booking', async () => {
    expect(tenantToken).toBeTruthy();
    expect(visitId).toBeTruthy();

    const res = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({
        visitId,
        notes: 'RentItEase release Lease Lifecycle E2E',
      });

    statusOk(res);

    const booking = extractData(res.body);

    bookingId = booking?.id ?? booking?.booking?.id ?? '';

    expect(bookingId).toBeTruthy();

    console.log(`Release Lease Lifecycle booking created: ${bookingId}`);
  });

  // ============================================================
  // 6. OWNER APPROVES BOOKING
  // ============================================================

  it('6. owner approves booking', async () => {
    expect(ownerToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  // ============================================================
  // 7. MOVE BOOKING TO PAYMENT PENDING
  // ============================================================

  it('7. tenant moves booking to payment pending', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set(auth(tenantToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('PAYMENT_PENDING');
  });

  // ============================================================
  // 8. CREATE / REUSE PAYMENT ORDER
  // ============================================================

  it('8. create Razorpay payment order', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    const bookingRes = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    const booking = extractData(bookingRes.body);

    expect(booking).toBeTruthy();
    expect(booking.id).toBe(bookingId);
    expect(booking.status).toBe('PAYMENT_PENDING');

    const existingPayment = booking.payment;

    if (
      existingPayment &&
      existingPayment.status !== 'FAILED' &&
      existingPayment.status !== 'REFUNDED'
    ) {
      console.log(`Reusing existing payment ${existingPayment.id}`);

      expect(existingPayment.razorpayOrderId).toBeTruthy();

      return;
    }

    const res = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({
        bookingId,
      });

    statusOk(res);

    const data = extractData(res.body);

    const paymentId = data?.paymentId ?? data?.payment?.id ?? '';

    const razorpayOrderId =
      data?.razorpayOrderId ?? data?.payment?.razorpayOrderId ?? '';

    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();

    console.log(`Razorpay order created: ${razorpayOrderId}`);
  });

  // ============================================================
  // 9. VERIFY PAYMENT → PAID
  // ============================================================

  it('9. verify Razorpay payment → PAID', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    const bookingRes = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    let booking = extractData(bookingRes.body);

    expect(booking).toBeTruthy();

    // If payment has already been completed, simply verify it.
    if (booking.status === 'PAID') {
      expect(booking.payment?.status).toBe('SUCCESS');
      return;
    }

    expect(booking.status).toBe('PAYMENT_PENDING');

    const payment = booking.payment;

    expect(payment).toBeTruthy();
    expect(payment.id).toBeTruthy();
    expect(payment.razorpayOrderId).toBeTruthy();

    const secret = process.env.E2E_RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error('E2E_RAZORPAY_KEY_SECRET is required.');
    }

    const razorpayPaymentId =
      process.env.E2E_RAZORPAY_PAYMENT_ID ||
      `pay_e2e_lease_lifecycle_${Date.now()}`;

    const signature = createHmac('sha256', secret)
      .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const res = await request(apiUrl())
      .post('/payments/verify')
      .set(auth(tenantToken))
      .send({
        bookingId,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
      });

    statusOk(res);

    const paymentData = extractData(res.body);

    expect(paymentData?.status).toBe('SUCCESS');

    // Confirm persisted PAID state.
    const persisted = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    booking = extractData(persisted.body);

    expect(booking?.id).toBe(bookingId);
    expect(booking?.status).toBe('PAID');
    expect(booking?.payment?.status).toBe('SUCCESS');
  });

  // ============================================================
  // 10. CREATE ACTIVE LEASE
  // ============================================================

  it('10. create ACTIVE lease from PAID booking', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    const res = await request(apiUrl())
      .post('/leases')
      .set(auth(tenantToken))
      .send({
        bookingId,
        startDate: new Date().toISOString(),
        notes: 'RentItEase Release E2E Lease Lifecycle',
      });

    statusOk(res);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();

    leaseId = lease?.id ?? '';

    expect(leaseId).toBeTruthy();
    expect(lease.bookingId).toBe(bookingId);
    expect(lease.propertyId).toBe(propertyId);
    expect(lease.tenantId).toBeTruthy();

    expect(lease.status).toBe('ACTIVE');

    expect(lease.monthlyRent).toBeTruthy();
    expect(lease.securityDeposit).toBeTruthy();
    expect(lease.startDate).toBeTruthy();

    console.log(`ACTIVE lease created: ${leaseId}`);
  });

  // ============================================================
  // 11. VERIFY OWNER ACCESS
  // ============================================================

  it('11. owner can retrieve the active lease', async () => {
    expect(ownerToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/leases/${leaseId}`)
      .set(auth(ownerToken))
      .expect(200);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('ACTIVE');
  });

  // ============================================================
  // 12. COMPLETE ACTIVE LEASE
  // ============================================================

  it('12. owner can complete an ACTIVE lease', async () => {
    expect(ownerToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/leases/${leaseId}/complete`)
      .set(auth(ownerToken));

    expect([200, 201]).toContain(res.status);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('COMPLETED');
    expect(lease.completedAt).toBeTruthy();
  });

  // ============================================================
  // 13. VERIFY COMPLETED LEASE
  // ============================================================

  it('13. completed lease remains persisted as COMPLETED', async () => {
    expect(tenantToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/leases/${leaseId}`)
      .set(auth(tenantToken))
      .expect(200);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('COMPLETED');
    expect(lease.completedAt).toBeTruthy();
  });

  // ============================================================
  // 14. VERIFY TENANT LEASE LIST
  // ============================================================

  it('14. tenant lease list contains the completed lease', async () => {
    expect(tenantToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get('/leases/my')
      .set(auth(tenantToken))
      .expect(200);

    const data = extractData(res.body);

    const leases = Array.isArray(data)
      ? data
      : (data?.leases ?? res.body?.leases ?? []);

    expect(Array.isArray(leases)).toBe(true);

    const lease = leases.find((item: any) => item?.id === leaseId);

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.bookingId).toBe(bookingId);
    expect(lease.propertyId).toBe(propertyId);
    expect(lease.status).toBe('COMPLETED');
  });

  // ============================================================
  // 15. VERIFY PROPERTY BECOMES AVAILABLE
  // ============================================================

  it('15. property becomes available after lease completion', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/properties/${propertyId}`)
      .set(auth(tenantToken))
      .expect(200);

    const property =
      res.body?.property ??
      extractData(res.body)?.property ??
      extractData(res.body);

    expect(property).toBeTruthy();
    expect(property.id).toBe(propertyId);
    expect(property.isAvailable).toBe(true);

    console.log(
      `Property availability verified: ${property.id} → isAvailable=${property.isAvailable}`,
    );
  });

  // ============================================================
  // 16. COMPLETED LEASE CANNOT BE COMPLETED AGAIN
  // ============================================================

  it('16. completed lease cannot be completed again', async () => {
    expect(ownerToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/leases/${leaseId}/complete`)
      .set(auth(ownerToken));

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    console.log(`Second completion correctly rejected with HTTP ${res.status}`);
  });
});
