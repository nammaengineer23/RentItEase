import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { apiUrl, auth, extractData, login, statusOk, futureIso } from './helpers';
import { createHmac } from 'crypto';

describe('RentItEase Release Workflow • sequential smoke', () => {
  let tenantToken = '';
  let ownerToken = '';
  let tenantId = '';
  let bookingId = '';
  let paymentId = '';
  let razorpayOrderId = '';
  let membershipId = '';

  it('01 Authentication: tenant + owner login', async () => {
    const tenant = await login(process.env.E2E_TENANT_LOGIN!, process.env.E2E_TENANT_PASSWORD!);
    const owner = await login(process.env.E2E_OWNER_LOGIN!, process.env.E2E_OWNER_PASSWORD!);
    tenantToken = tenant.token;
    ownerToken = owner.token;
    const tenantData = extractData(tenant.body);
    tenantId = tenantData?.user?.id ?? tenantData?.id;
    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    expect(tenantId).toBeTruthy();
  });

  it('02 Tenant → Property → Visit', async () => {
    const res = await request(apiUrl())
      .post('/property-visits')
      .set(auth(tenantToken))
      .send({
        propertyId: process.env.E2E_PROPERTY_ID,
        visitDate: futureIso(45),
        notes: 'Release workflow',
      });
    statusOk(res);
    const visitId = extractData(res.body)?.id;
    expect(visitId).toBeTruthy();

    const approve = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));
    statusOk(approve);

    const booking = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({ visitId, notes: 'Release workflow booking' });
    statusOk(booking);
    bookingId = extractData(booking.body)?.id;
    expect(bookingId).toBeTruthy();

    const approveBooking = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));
    statusOk(approveBooking);
  });

  it('03 Payment → verification → PAID', async () => {
    const order = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({ bookingId });
    statusOk(order);
    const d = extractData(order.body);
    paymentId = d?.paymentId;
    razorpayOrderId = d?.razorpayOrderId;
    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();

    const secret = process.env.E2E_RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('E2E_RAZORPAY_KEY_SECRET is required.');
    const razorpayPaymentId = `pay_release_${Date.now()}`;
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
    expect(extractData(verify.body)?.status).toBe('SUCCESS');

    const booking = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);
    expect(extractData(booking.body)?.status).toBe('PAID');
  });

  it('04 Invoice → history → PAID', async () => {
    const create = await request(apiUrl())
      .post('/invoices')
      .send({
        userId: tenantId,
        paymentId,
        amount: 1000,
        taxAmount: 0,
        description: 'Release workflow invoice',
        currency: 'INR',
      });
    statusOk(create);
    const invoiceId = extractData(create.body)?.id;
    expect(invoiceId).toBeTruthy();

    await request(apiUrl()).get(`/invoices/${invoiceId}`).expect(200);
    await request(apiUrl()).get(`/invoices/user/${tenantId}`).expect(200);

    const paid = await request(apiUrl()).patch(`/invoices/${invoiceId}/paid`);
    statusOk(paid);
    expect(extractData(paid.body)?.status).toBe('PAID');
  });

  it('05 Membership → activation → expiry → renewal', async () => {
    const plan = await request(apiUrl())
      .post('/membership/plans')
      .send({
        name: `Release Premium ${Date.now()}`,
        code: 'PREMIUM',
        price: 1,
        durationDays: 1,
      });
    statusOk(plan);
    const planId = extractData(plan.body)?.id;
    expect(planId).toBeTruthy();

    const membership = await request(apiUrl())
      .post(`/membership/users/${tenantId}`)
      .send({ planId, autoRenew: false });
    statusOk(membership);
    membershipId = extractData(membership.body)?.id;
    expect(membershipId).toBeTruthy();

    const activate = await request(apiUrl()).patch(`/membership/${membershipId}/activate`);
    statusOk(activate);
    expect(extractData(activate.body)?.status).toBe('ACTIVE');

    const expire = await request(apiUrl()).patch(`/membership/${membershipId}/expire`);
    statusOk(expire);
    expect(extractData(expire.body)?.status).toBe('EXPIRED');

    const renew = await request(apiUrl()).patch(`/membership/${membershipId}/renew`);
    statusOk(renew);
    expect(extractData(renew.body)?.status).toBe('ACTIVE');
  });

  it('06 Premium listing → activation → expiry', async () => {
    const owner = await login(process.env.E2E_OWNER_LOGIN!, process.env.E2E_OWNER_PASSWORD!);
    const ownerData = extractData(owner.body);
    const ownerId = ownerData?.user?.id ?? ownerData?.id;

    const create = await request(apiUrl())
      .post(`/premium-listings/users/${ownerId}`)
      .send({
        propertyId: process.env.E2E_PROPERTY_ID,
        membershipId,
        durationDays: 1,
        amount: 1,
        currency: 'INR',
      });
    statusOk(create);
    const listingId = extractData(create.body)?.id;
    expect(listingId).toBeTruthy();

    const activate = await request(apiUrl()).patch(`/premium-listings/${listingId}/activate`);
    statusOk(activate);
    expect(extractData(activate.body)?.status).toBe('ACTIVE');

    const expire = await request(apiUrl()).patch(`/premium-listings/${listingId}/expire`);
    statusOk(expire);
    expect(extractData(expire.body)?.status).toBe('EXPIRED');
  });

  it('07 Chat → send → read → edit → delete', async () => {
    const conv = await request(apiUrl())
      .post('/chat/conversations')
      .set(auth(tenantToken))
      .send({ propertyId: process.env.E2E_PROPERTY_ID });
    statusOk(conv);
    const conversationId = extractData(conv.body)?.id;

    const sent = await request(apiUrl())
      .post(`/chat/conversations/${conversationId}/messages`)
      .set(auth(tenantToken))
      .send({ text: `Release workflow ${Date.now()}` });
    statusOk(sent);
    const messageId = extractData(sent.body)?.id;
    expect(messageId).toBeTruthy();

    statusOk(await request(apiUrl()).patch(`/chat/conversations/${conversationId}/read`).set(auth(tenantToken)));
    statusOk(await request(apiUrl()).patch(`/chat/messages/${messageId}`).set(auth(tenantToken)).send({ text: 'edited' }));
    statusOk(await request(apiUrl()).delete(`/chat/messages/${messageId}`).set(auth(tenantToken)));
  });

  it('08 Push notification contract', async () => {
    const res = await request(apiUrl())
      .post('/push-notifications/test')
      .set(auth(tenantToken));
    statusOk(res);
  });

  it('09 Admin → users → properties → reviews → visits → billing', async () => {
    const admin = await login(process.env.E2E_ADMIN_LOGIN!, process.env.E2E_ADMIN_PASSWORD!);
    const token = admin.token;
    for (const route of [
      '/admin/dashboard',
      '/admin/users',
      '/admin/properties',
      '/admin/reviews',
      '/admin/visits',
      '/admin/analytics',
      '/admin/billing/memberships',
      '/admin/billing/premium-listings',
      '/admin/billing/payments',
      '/admin/billing/invoices',
    ]) {
      await request(apiUrl()).get(route).set(auth(token)).expect(200);
    }
  });

  it('10 Lease API gate', async () => {
    const res = await request(apiUrl()).get('/leases').set(auth(tenantToken));
    if (res.status === 404) {
      throw new Error(
        'Release blocked: Lease Prisma model exists in the supplied snapshot, but /leases controller/module is missing.',
      );
    }
    expect([200, 401, 403]).toContain(res.status);
  });
});
