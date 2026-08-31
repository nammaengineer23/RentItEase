import request from 'supertest';
import { createHmac } from 'crypto';
import { describe, expect, it } from '@jest/globals';

import { apiUrl, auth, createApprovedE2EProperty, extractData, futureIso, login, statusOk } from './helpers';

describe('Release E2E • Lease', () => {
  let tenantToken = '';
  let ownerToken = '';
  let adminToken = '';

  let bookingId = '';
  let leaseId = '';

  // When an existing lease is reused, its status may be COMPLETED.
  // When this test creates a new lease, the expected status is ACTIVE.
  let expectedLeaseStatus = 'ACTIVE';

  let propertyId = process.env.E2E_PROPERTY_ID!;

  // ============================================================
  // 1. LOGIN
  // ============================================================

  it('1. tenant + owner login', async () => {
    expect(propertyId).toBeTruthy();

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
  // 2. FIND PAID BOOKING
  // ============================================================

  it('2. find reusable PAID booking', async () => {
    expect(tenantToken).toBeTruthy();

    const configuredBookingId = process.env.E2E_BOOKING_ID;

    // ----------------------------------------------------------
    // Configured booking
    // ----------------------------------------------------------

    if (configuredBookingId) {
      const bookingRes = await request(apiUrl())
        .get(`/bookings/${configuredBookingId}`)
        .set(auth(tenantToken))
        .expect(200);

      const booking = extractData(bookingRes.body);

      expect(booking).toBeTruthy();
      expect(booking.id).toBe(configuredBookingId);
      expect(booking.status).toBe('PAID');

      bookingId = configuredBookingId;

      console.log(`Configured PAID booking: ${bookingId}`);

      // If booking endpoint exposes the lease, reuse it.
      if (booking.lease?.id) {
        leaseId = booking.lease.id;
        expectedLeaseStatus = booking.lease.status;

        console.log(
          `Configured booking already has lease: ${leaseId} (${expectedLeaseStatus})`,
        );
      }

      return;
    }

    // ----------------------------------------------------------
    // Get tenant bookings
    // ----------------------------------------------------------

    const bookingsRes = await request(apiUrl())
      .get('/bookings/tenant')
      .set(auth(tenantToken))
      .expect(200);

    const bookingData = extractData(bookingsRes.body);

    const bookings = Array.isArray(bookingData)
      ? bookingData
      : (bookingData?.bookings ?? bookingsRes.body?.bookings ?? []);

    const paidBookings = bookings.filter(
      (booking: any) =>
        booking?.propertyId === propertyId &&
        booking?.status === 'PAID',
    );

    if (paidBookings.length === 0) {
      // The release database may have been intentionally cleaned. Build a
      // complete isolated payment flow instead of depending on retained data.
      propertyId = await createApprovedE2EProperty(ownerToken, adminToken, 'Release Lease');
      const visit = await request(apiUrl()).post('/property-visits').set(auth(tenantToken)).send({
        propertyId, visitDate: futureIso(45), notes: '[E2E] Lease fixture',
      });
      statusOk(visit);
      const visitId = extractData(visit.body)?.id;
      expect(visitId).toBeTruthy();
      statusOk(await request(apiUrl()).patch(`/property-visits/${visitId}/approve`).set(auth(ownerToken)));
      const booking = await request(apiUrl()).post('/bookings').set(auth(tenantToken)).send({
        visitId, notes: '[E2E] Lease fixture',
      });
      statusOk(booking);
      bookingId = extractData(booking.body)?.id ?? '';
      expect(bookingId).toBeTruthy();
      statusOk(await request(apiUrl()).patch(`/bookings/${bookingId}/approve`).set(auth(ownerToken)));
      statusOk(await request(apiUrl()).patch(`/bookings/${bookingId}/payment-pending`).set(auth(tenantToken)));
      const order = await request(apiUrl()).post('/payments/order').set(auth(tenantToken)).send({ bookingId });
      statusOk(order);
      const payment = extractData(order.body);
      const orderId = payment?.razorpayOrderId ?? payment?.payment?.razorpayOrderId;
      expect(orderId).toBeTruthy();
      const secret = process.env.E2E_RAZORPAY_KEY_SECRET;
      if (!secret) throw new Error('E2E_RAZORPAY_KEY_SECRET is required.');
      const paymentId = `pay_e2e_lease_${Date.now()}`;
      const signature = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
      const verified = await request(apiUrl()).post('/payments/verify').set(auth(tenantToken)).send({
        bookingId, razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature,
      });
      statusOk(verified);
      console.log(`Created isolated PAID booking for lease: ${bookingId}`);
      return;
    }

    console.log(
      'PAID bookings:',
      paidBookings.map((booking: any) => ({
        id: booking.id,
        propertyId: booking.propertyId,
        status: booking.status,
      })),
    );

    // ----------------------------------------------------------
    // Get actual tenant leases
    // ----------------------------------------------------------

    const leasesRes = await request(apiUrl())
      .get('/leases/my')
      .set(auth(tenantToken))
      .expect(200);

    const leaseData = extractData(leasesRes.body);

    const leases = Array.isArray(leaseData)
      ? leaseData
      : (leaseData?.leases ?? leasesRes.body?.leases ?? []);

    console.log(
      'Existing leases:',
      leases.map((lease: any) => ({
        id: lease.id,
        bookingId: lease.bookingId,
        propertyId: lease.propertyId,
        status: lease.status,
      })),
    );

    // ----------------------------------------------------------
    // First preference:
    // Reuse a PAID booking that already has a lease.
    //
    // This makes the release test repeatable against the current
    // production database.
    // ----------------------------------------------------------

    const paidBookingWithLease = paidBookings.find(
      (booking: any) =>
        leases.some(
          (lease: any) =>
            lease?.bookingId === booking?.id &&
            lease?.propertyId === propertyId,
        ),
    );

    if (paidBookingWithLease) {
      bookingId = paidBookingWithLease.id;

      const existingLease = leases.find(
        (lease: any) =>
          lease?.bookingId === bookingId &&
          lease?.propertyId === propertyId,
      );

      expect(existingLease?.id).toBeTruthy();

      leaseId = existingLease.id;
      expectedLeaseStatus = existingLease.status;

      console.log(
        `Reusing existing PAID booking ${bookingId} with lease ${leaseId} (${expectedLeaseStatus})`,
      );

      return;
    }

    // ----------------------------------------------------------
    // Second preference:
    // Find a PAID booking without a lease.
    // ----------------------------------------------------------

    const reusableBooking = paidBookings.find(
      (booking: any) =>
        !leases.some(
          (lease: any) =>
            lease?.bookingId === booking?.id &&
            lease?.propertyId === propertyId,
        ),
    );

    if (reusableBooking) {
      bookingId = reusableBooking.id;

      console.log(
        `Found genuinely reusable PAID booking without lease: ${bookingId}`,
      );

      return;
    }

    // ----------------------------------------------------------
    // No usable booking exists.
    // ----------------------------------------------------------

    console.log('No usable PAID booking was found.');

    expect(
      paidBookings.length,
    ).toBeGreaterThan(0);

    throw new Error(
      'No PAID booking is available for lease E2E testing. ' +
        'All PAID bookings already have leases. ' +
        'Create another PAID booking through the payment E2E flow or configure E2E_BOOKING_ID.',
    );
  });

  // ============================================================
  // 3. CREATE / REUSE LEASE
  // ============================================================

  it('3. create/reuse lease from paid booking', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    // ----------------------------------------------------------
    // If step 2 already found an existing lease, reuse it.
    // ----------------------------------------------------------

    if (leaseId) {
      console.log(
        `Lease already selected in step 2: ${leaseId} (${expectedLeaseStatus})`,
      );

      expect(leaseId).toBeTruthy();

      return;
    }

    // ----------------------------------------------------------
    // Check tenant lease list one more time.
    // ----------------------------------------------------------

    const leasesRes = await request(apiUrl())
      .get('/leases/my')
      .set(auth(tenantToken))
      .expect(200);

    const leaseData = extractData(leasesRes.body);

    const leases = Array.isArray(leaseData)
      ? leaseData
      : (leaseData?.leases ?? leasesRes.body?.leases ?? []);

    const existingLease = leases.find(
      (lease: any) =>
        lease?.bookingId === bookingId &&
        lease?.propertyId === propertyId,
    );

    if (existingLease?.id) {
      leaseId = existingLease.id;
      expectedLeaseStatus = existingLease.status;

      console.log(
        `Reusing existing lease: ${leaseId} (${expectedLeaseStatus})`,
      );

      return;
    }

    // ----------------------------------------------------------
    // Verify booking is still PAID.
    // ----------------------------------------------------------

    const bookingRes = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    const booking = extractData(bookingRes.body);

    expect(booking).toBeTruthy();
    expect(booking.id).toBe(bookingId);
    expect(booking.status).toBe('PAID');

    // ----------------------------------------------------------
    // Create new lease.
    // ----------------------------------------------------------

    const startDate = new Date();

    const createLease = await request(apiUrl())
      .post('/leases')
      .set(auth(tenantToken))
      .send({
        bookingId,
        startDate: startDate.toISOString(),
        notes: 'RentItEase Release E2E Lease',
      });

    console.log('LEASE CREATE STATUS:', createLease.status);

    console.log(
      'LEASE CREATE RESPONSE:',
      JSON.stringify(createLease.body, null, 2),
    );

    // ----------------------------------------------------------
    // Normal successful creation.
    // ----------------------------------------------------------

    if (createLease.status === 200 || createLease.status === 201) {
      const lease = extractData(createLease.body);

      expect(lease).toBeTruthy();

      leaseId = lease?.id ?? '';

      expect(leaseId).toBeTruthy();
      expect(lease.bookingId).toBe(bookingId);
      expect(lease.tenantId).toBeTruthy();
      expect(lease.propertyId).toBe(propertyId);

      expect(lease.status).toBe('ACTIVE');

      expect(lease.monthlyRent).toBeTruthy();
      expect(lease.securityDeposit).toBeTruthy();

      expectedLeaseStatus = 'ACTIVE';

      console.log(`Created new lease: ${leaseId}`);

      return;
    }

    // ----------------------------------------------------------
    // Race-safe fallback:
    //
    // If another request created the lease between our checks,
    // the API correctly returns:
    //
    // "A lease already exists for this booking."
    //
    // Recover by reading the persisted lease instead of failing
    // the complete release suite.
    // ----------------------------------------------------------

    if (
      createLease.status === 400 &&
      createLease.body?.error?.message ===
        'A lease already exists for this booking.'
    ) {
      console.log(
        'Lease was created between checks. Re-fetching persisted lease...',
      );

      const refreshedLeasesRes = await request(apiUrl())
        .get('/leases/my')
        .set(auth(tenantToken))
        .expect(200);

      const refreshedLeaseData = extractData(
        refreshedLeasesRes.body,
      );

      const refreshedLeases = Array.isArray(refreshedLeaseData)
        ? refreshedLeaseData
        : (
            refreshedLeaseData?.leases ??
            refreshedLeasesRes.body?.leases ??
            []
          );

      const recoveredLease = refreshedLeases.find(
        (lease: any) =>
          lease?.bookingId === bookingId &&
          lease?.propertyId === propertyId,
      );

      expect(recoveredLease?.id).toBeTruthy();

      leaseId = recoveredLease.id;
      expectedLeaseStatus = recoveredLease.status;

      console.log(
        `Recovered persisted lease: ${leaseId} (${expectedLeaseStatus})`,
      );

      return;
    }

    // ----------------------------------------------------------
    // Any other API failure should fail the release test.
    // ----------------------------------------------------------

    throw new Error(
      `Lease creation failed with HTTP ${createLease.status}: ` +
        JSON.stringify(createLease.body),
    );
  });

  // ============================================================
  // 4. VERIFY PERSISTED LEASE
  // ============================================================

  it('4. retrieve and verify persisted lease', async () => {
    expect(tenantToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/leases/${leaseId}`)
      .set(auth(tenantToken))
      .expect(200);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();

    expect(lease.id).toBe(leaseId);
    expect(lease.bookingId).toBe(bookingId);
    expect(lease.propertyId).toBe(propertyId);

    expect(lease.status).toBe(expectedLeaseStatus);

    expect(lease.monthlyRent).toBeTruthy();
    expect(lease.securityDeposit).toBeTruthy();
    expect(lease.startDate).toBeTruthy();

    console.log(
      `Persisted lease verified: ${lease.id} (${lease.status})`,
    );
  });

  // ============================================================
  // 5. VERIFY TENANT LEASE LIST
  // ============================================================

  it('5. tenant lease list contains the lease', async () => {
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

    const lease = leases.find(
      (item: any) => item?.id === leaseId,
    );

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.bookingId).toBe(bookingId);
    expect(lease.propertyId).toBe(propertyId);
    expect(lease.status).toBe(expectedLeaseStatus);

    console.log(
      `Tenant lease list verified: ${lease.id} (${lease.status})`,
    );
  });

  // ============================================================
  // 6. VERIFY OWNER LEASE LIST
  // ============================================================

  it('6. owner lease list contains the lease', async () => {
    expect(ownerToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get('/leases/owner')
      .set(auth(ownerToken))
      .expect(200);

    const data = extractData(res.body);

    const leases = Array.isArray(data)
      ? data
      : (data?.leases ?? res.body?.leases ?? []);

    expect(Array.isArray(leases)).toBe(true);

    const lease = leases.find(
      (item: any) => item?.id === leaseId,
    );

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.bookingId).toBe(bookingId);
    expect(lease.propertyId).toBe(propertyId);
    expect(lease.status).toBe(expectedLeaseStatus);

    console.log(
      `Owner lease list verified: ${lease.id} (${lease.status})`,
    );
  });
});
