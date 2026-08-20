import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import {
  apiUrl,
  auth,
  extractData,
  login,
} from './helpers';

describe('Release E2E • Lease', () => {
  let tenantToken = '';
  let ownerToken = '';

  let bookingId = '';
  let leaseId = '';

  const propertyId = process.env.E2E_PROPERTY_ID!;

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

    tenantToken = tenant.token;
    ownerToken = owner.token;

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
  });

  // ============================================================
  // 2. FIND PAID BOOKING
  // ============================================================

  it('2. find reusable PAID booking', async () => {
    expect(tenantToken).toBeTruthy();

    const configuredBookingId = process.env.E2E_BOOKING_ID;

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
      return;
    }

    const bookingsRes = await request(apiUrl())
      .get('/bookings/tenant')
      .set(auth(tenantToken))
      .expect(200);

    const bookingData = extractData(bookingsRes.body);

    const bookings = Array.isArray(bookingData)
      ? bookingData
      : bookingData?.bookings ?? bookingsRes.body?.bookings ?? [];

    const paidBooking = bookings.find(
      (booking: any) =>
        booking?.propertyId === propertyId &&
        booking?.status === 'PAID',
    );

    expect(
      paidBooking?.id,
    ).toBeTruthy();

    bookingId = paidBooking.id;

    expect(bookingId).toBeTruthy();
  });

  // ============================================================
  // 3. CREATE / REUSE LEASE
  // ============================================================

  it('3. create/reuse lease from paid booking', async () => {
    expect(tenantToken).toBeTruthy();
    expect(bookingId).toBeTruthy();

    // First check whether this booking already has a lease.
    const bookingRes = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    const booking = extractData(bookingRes.body);

    expect(booking).toBeTruthy();
    expect(booking.id).toBe(bookingId);
    expect(booking.status).toBe('PAID');

    if (booking.lease?.id) {
      leaseId = booking.lease.id;

      expect(leaseId).toBeTruthy();
      return;
    }

    const startDate = new Date();

    const createLease = await request(apiUrl())
      .post('/leases')
      .set(auth(tenantToken))
      .send({
        bookingId,
        startDate: startDate.toISOString(),
        notes: 'RentItEase Release E2E Lease',
      });

    expect([200, 201]).toContain(createLease.status);

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

    expect(lease.status).toBe('ACTIVE');

    expect(lease.monthlyRent).toBeTruthy();
    expect(lease.securityDeposit).toBeTruthy();
    expect(lease.startDate).toBeTruthy();
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
      : data?.leases ?? res.body?.leases ?? [];

    expect(Array.isArray(leases)).toBe(true);

    const lease = leases.find(
      (item: any) => item?.id === leaseId,
    );

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('ACTIVE');
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
      : data?.leases ?? res.body?.leases ?? [];

    expect(Array.isArray(leases)).toBe(true);

    const lease = leases.find(
      (item: any) => item?.id === leaseId,
    );

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('ACTIVE');
  });
});
