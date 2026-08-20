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
  let propertyId = '';
  let visitId = '';
  let bookingId = '';

  it('0. tenant and owner login', async () => {
    const tenantLogin = await login(
      process.env.E2E_TENANT_EMAIL!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    const ownerLogin = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );

    tenantToken = tenantLogin.token;
    ownerToken = ownerLogin.token;

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
  });

  it('1. owner creates fresh E2E property', async () => {
    const res = await request(apiUrl())
      .post('/properties')
      .set(auth(ownerToken))
      .send({
        title: `Release Booking Test Property ${Date.now()}`,
        description:
          'Dedicated property created automatically by the RentItEase Booking release E2E test.',
        price: 25000,
        address: '123 Release Booking Test Road',
        locality: 'HSR Layout',
        landmark: 'Near Release Booking Test Junction',
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
      });

    statusOk(res);

    const property =
      res.body?.property ??
      extractData(res.body)?.property ??
      extractData(res.body);

    propertyId = property?.id;

    expect(propertyId).toBeTruthy();

    console.log(`Release Booking E2E property created: ${propertyId}`);
  });

  it('2. tenant creates visit', async () => {
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

    console.log(`Release Booking E2E visit created: ${visitId}`);
  });

  it('3. owner approves visit', async () => {
    const res = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  it('4. tenant creates booking', async () => {
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
  });

  it('5. owner sees booking', async () => {
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

  it('6. owner approves booking', async () => {
    expect(bookingId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  it('7. tenant retrieves approved booking', async () => {
    expect(bookingId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    expect(extractData(res.body)?.id).toBe(bookingId);
    expect(extractData(res.body)?.status).toBe('APPROVED');
  });

  it('8. tenant moves booking to payment pending', async () => {
    expect(bookingId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set(auth(tenantToken));

    statusOk(res);

    expect(extractData(res.body)?.status).toBe('PAYMENT_PENDING');
  });
});
