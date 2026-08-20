import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import {
  apiUrl,
  auth,
  extractData,
  login,
  futureIso,
  statusOk,
} from './helpers';

describe('Release E2E • Booking', () => {
  let tenantToken = '';
  let ownerToken = '';
  let visitId = '';
  let bookingId = '';

  const propertyId = process.env.E2E_PROPERTY_ID!;

  it('0. cleanup previous E2E booking', async () => {
    const tenantLogin = await login(
      process.env.E2E_TENANT_EMAIL!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    tenantToken = tenantLogin.token;

    const res = await request(apiUrl())
      .get('/bookings/tenant')
      .set(auth(tenantToken))
      .expect(200);

    const data = extractData(res.body);

    const bookings = Array.isArray(data)
      ? data
      : data?.bookings ?? res.body?.bookings ?? [];

    const activeStatuses = [
      'PENDING',
      'APPROVED',
      'PAYMENT_PENDING',
      'PAID',
    ];

    const existingBookings = bookings.filter(
      (booking: any) =>
        booking.propertyId === propertyId &&
        activeStatuses.includes(booking.status),
    );

    for (const booking of existingBookings) {
      // PAID bookings must never be cancelled by release-test cleanup.
      if (booking.status === 'PAID') {
        throw new Error(
          `E2E property has a PAID booking (${booking.id}). ` +
            'Do not cancel it automatically. Use a dedicated E2E property.',
        );
      }

      const cancelRes = await request(apiUrl())
        .patch(`/bookings/${booking.id}/cancel`)
        .set(auth(tenantToken));

      statusOk(cancelRes);

      expect(extractData(cancelRes.body)?.status).toBe('CANCELLED');
    }
  });

  it('1. tenant login', async () => {
    // Reuse the token from cleanup when available.
    if (!tenantToken) {
      tenantToken = (
        await login(
          process.env.E2E_TENANT_EMAIL!,
          process.env.E2E_TENANT_PASSWORD!,
        )
      ).token;
    }

    expect(tenantToken).toBeTruthy();
  });

  it('2. owner login', async () => {
    ownerToken = (
      await login(
        process.env.E2E_OWNER_EMAIL!,
        process.env.E2E_OWNER_PASSWORD!,
      )
    ).token;

    expect(ownerToken).toBeTruthy();
  });

  it('3. tenant creates visit', async () => {
    const res = await request(apiUrl())
      .post('/property-visits')
      .set(auth(tenantToken))
      .send({
        propertyId,
        visitDate: futureIso(45),
        notes: 'RentItEase release Booking E2E',
      });

    statusOk(res);

    const visit = extractData(res.body);

    visitId = visit?.id ?? visit?.visit?.id;

    expect(visitId).toBeTruthy();
  });

  it('4. owner approves visit', async () => {
    const res = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  it('5. tenant creates booking', async () => {
    const res = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({
        visitId,
        notes: 'RentItEase release Booking E2E',
      });

    statusOk(res);

    const booking = extractData(res.body);

    bookingId = booking?.id ?? booking?.booking?.id;

    expect(bookingId).toBeTruthy();

    console.log(`E2E BOOKING ID: ${bookingId}`);

    process.env.E2E_BOOKING_ID = bookingId!;
  });

  it('6. owner sees booking', async () => {
    const res = await request(apiUrl())
      .get('/bookings/owner')
      .set(auth(ownerToken))
      .expect(200);

    const data = extractData(res.body);

    const list = Array.isArray(data)
      ? data
      : data?.bookings ?? res.body?.bookings ?? [];

    expect(JSON.stringify(list)).toContain(bookingId);
  });

  it('7. owner approves booking', async () => {
    const res = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  it('8. tenant retrieves approved booking', async () => {
    const res = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    expect(extractData(res.body)?.id).toBe(bookingId);

    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  it('9. tenant moves booking to payment pending', async () => {
    const res = await request(apiUrl())
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set(auth(tenantToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('PAYMENT_PENDING');
  });
});