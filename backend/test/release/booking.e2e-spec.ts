import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import {
  apiUrl, auth, extractData, login, futureIso, statusOk,
} from './helpers';

describe('Release E2E • Booking', () => {
  let tenantToken = '';
  let ownerToken = '';
  let visitId = '';
  let bookingId = '';

  it('1. tenant login', async () => {
    tenantToken = (
      await login(process.env.E2E_TENANT_LOGIN!, process.env.E2E_TENANT_PASSWORD!)
    ).token;
    expect(tenantToken).toBeTruthy();
  });

  it('2. owner login', async () => {
    ownerToken = (
      await login(process.env.E2E_OWNER_LOGIN!, process.env.E2E_OWNER_PASSWORD!)
    ).token;
    expect(ownerToken).toBeTruthy();
  });

  it('3. tenant creates visit', async () => {
    const res = await request(apiUrl())
      .post('/property-visits')
      .set(auth(tenantToken))
      .send({
        propertyId: process.env.E2E_PROPERTY_ID,
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
      .send({ visitId, notes: 'RentItEase release Booking E2E' });
    statusOk(res);
    bookingId = extractData(res.body)?.id ?? extractData(res.body)?.booking?.id;
    expect(bookingId).toBeTruthy();
    process.env.E2E_BOOKING_ID = bookingId!;
  });

  it('6. owner sees booking', async () => {
    const res = await request(apiUrl())
      .get('/bookings/owner')
      .set(auth(ownerToken))
      .expect(200);
    const list = Array.isArray(res.body) ? res.body : (res.body?.data ?? []);
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
