import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import {
  apiUrl,
  auth,
  extractData,
  login,
  statusOk,
  futureIso,
} from './helpers';
import { createHmac } from 'crypto';

describe('RentItEase Release Workflow • sequential smoke', () => {
  let tenantToken = '';
  let ownerToken = '';
  let tenantId = '';
  let ownerId = '';
  let propertyId = '';
  let bookingId = '';
  let paymentId = '';
  let razorpayOrderId = '';
  let membershipId = '';

  // ============================================================
  // 01 Authentication
  // ============================================================

  it('01 Authentication: tenant + owner login', async () => {
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

    const tenantData = extractData(tenant.body);
    const ownerData = extractData(owner.body);

    tenantId = tenantData?.user?.id ?? tenantData?.id;
    ownerId = ownerData?.user?.id ?? ownerData?.id;

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    expect(tenantId).toBeTruthy();
    expect(ownerId).toBeTruthy();
  });

  // ============================================================
  // 02 Owner → Property → Tenant Visit → Booking
  // ============================================================

  it('02 Tenant → Property → Visit → Booking', async () => {
    // ----------------------------------------------------------
    // Create a fresh property owned by the E2E owner.
    // ----------------------------------------------------------

    const property = await request(apiUrl())
      .post('/properties')
      .set(auth(ownerToken))
      .send({
        title: `Release Test Property ${Date.now()}`,
        description:
          'Property created automatically by the RentItEase release E2E workflow.',
        price: 25000,
        address: '123 Release Test Road',
        locality: 'HSR Layout',
        landmark: 'Near Release Test Junction',
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

    statusOk(property);

    const propertyData =
      property.body?.property ??
      extractData(property.body)?.property ??
      extractData(property.body);

    propertyId = propertyData?.id;

    expect(propertyId).toBeTruthy();

    console.log(`Release E2E property created: ${propertyId}`);

    // ----------------------------------------------------------
    // Tenant creates a visit.
    // ----------------------------------------------------------

    const visit = await request(apiUrl())
      .post('/property-visits')
      .set(auth(tenantToken))
      .send({
        propertyId,
        visitDate: futureIso(45),
        notes: 'Release workflow visit',
      });

    statusOk(visit);

    const visitData = extractData(visit.body);
    const visitId = visitData?.id;

    expect(visitId).toBeTruthy();

    // ----------------------------------------------------------
    // Owner approves the visit.
    // ----------------------------------------------------------

    const approveVisit = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveVisit);

    expect(extractData(approveVisit.body)?.status).toBe('APPROVED');

    // ----------------------------------------------------------
    // Tenant creates booking from approved visit.
    // ----------------------------------------------------------

    const booking = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({
        visitId,
        notes: 'Release workflow booking',
      });

    statusOk(booking);

    bookingId = extractData(booking.body)?.id;

    expect(bookingId).toBeTruthy();

    // ----------------------------------------------------------
    // Owner approves booking.
    // ----------------------------------------------------------

    const approveBooking = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveBooking);

    expect(extractData(approveBooking.body)?.status).toBe('APPROVED');

    // ----------------------------------------------------------
    // Tenant moves booking to PAYMENT_PENDING.
    // ----------------------------------------------------------

    const paymentPending = await request(apiUrl())
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set(auth(tenantToken));

    statusOk(paymentPending);

    expect(extractData(paymentPending.body)?.status).toBe(
      'PAYMENT_PENDING',
    );
  });

  // ============================================================
  // 03 Payment → verification → PAID
  // ============================================================

  it('03 Payment → verification → PAID', async () => {
    expect(bookingId).toBeTruthy();

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

    if (!secret) {
      throw new Error(
        'E2E_RAZORPAY_KEY_SECRET is required.',
      );
    }

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

  // ============================================================
  // 04 Invoice
  // ============================================================

  it('04 Invoice → history → PAID', async () => {
    expect(paymentId).toBeTruthy();
    expect(tenantId).toBeTruthy();

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

    await request(apiUrl())
      .get(`/invoices/${invoiceId}`)
      .expect(200);

    await request(apiUrl())
      .get(`/invoices/user/${tenantId}`)
      .expect(200);

    const paid = await request(apiUrl())
      .patch(`/invoices/${invoiceId}/paid`);

    statusOk(paid);

    expect(extractData(paid.body)?.status).toBe('PAID');
  });

  // ============================================================
  // 05 Membership
  // ============================================================

  it('05 Membership → activation → expiry → renewal', async () => {
    const plan = await request(apiUrl())
      .post('/membership/plans')
      .send({
        name: `Release Premium ${Date.now()}`,
        code: `PREMIUM_RELEASE_${Date.now()}`,
        price: 1,
        durationDays: 1,
      });

    statusOk(plan);

    const planId = extractData(plan.body)?.id;

    expect(planId).toBeTruthy();

    const membership = await request(apiUrl())
      .post(`/membership/users/${tenantId}`)
      .send({
        planId,
        autoRenew: false,
      });

    statusOk(membership);

    membershipId = extractData(membership.body)?.id;

    expect(membershipId).toBeTruthy();

    const activate = await request(apiUrl()).patch(
      `/membership/${membershipId}/activate`,
    );

    statusOk(activate);

    expect(extractData(activate.body)?.status).toBe(
      'ACTIVE',
    );

    const expire = await request(apiUrl()).patch(
      `/membership/${membershipId}/expire`,
    );

    statusOk(expire);

    expect(extractData(expire.body)?.status).toBe(
      'EXPIRED',
    );

    const renew = await request(apiUrl()).patch(
      `/membership/${membershipId}/renew`,
    );

    statusOk(renew);

    expect(extractData(renew.body)?.status).toBe(
      'ACTIVE',
    );
  });

  // ============================================================
  // 06 Premium Listing
  // ============================================================

  it('06 Premium listing → activation → expiry', async () => {
    expect(ownerId).toBeTruthy();
    expect(propertyId).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const create = await request(apiUrl())
      .post(`/premium-listings/users/${ownerId}`)
      .send({
        propertyId,
        membershipId,
        durationDays: 1,
        amount: 1,
        currency: 'INR',
      });

    statusOk(create);

    const listingId = extractData(create.body)?.id;

    expect(listingId).toBeTruthy();

    const activate = await request(apiUrl()).patch(
      `/premium-listings/${listingId}/activate`,
    );

    statusOk(activate);

    expect(extractData(activate.body)?.status).toBe(
      'ACTIVE',
    );

    const expire = await request(apiUrl()).patch(
      `/premium-listings/${listingId}/expire`,
    );

    statusOk(expire);

    expect(extractData(expire.body)?.status).toBe(
      'EXPIRED',
    );
  });

  // ============================================================
  // 07 Chat
  // ============================================================

  it('07 Chat → send → read → edit → delete', async () => {
    expect(propertyId).toBeTruthy();

    const conv = await request(apiUrl())
      .post('/chat/conversations')
      .set(auth(tenantToken))
      .send({
        propertyId,
      });

    statusOk(conv);

    const conversationId = extractData(conv.body)?.id;

    expect(conversationId).toBeTruthy();

    const sent = await request(apiUrl())
      .post(
        `/chat/conversations/${conversationId}/messages`,
      )
      .set(auth(tenantToken))
      .send({
        text: `Release workflow ${Date.now()}`,
      });

    statusOk(sent);

    const messageId = extractData(sent.body)?.id;

    expect(messageId).toBeTruthy();

    statusOk(
      await request(apiUrl())
        .patch(
          `/chat/conversations/${conversationId}/read`,
        )
        .set(auth(tenantToken)),
    );

    statusOk(
      await request(apiUrl())
        .patch(`/chat/messages/${messageId}`)
        .set(auth(tenantToken))
        .send({
          text: 'edited',
        }),
    );

    statusOk(
      await request(apiUrl())
        .delete(`/chat/messages/${messageId}`)
        .set(auth(tenantToken)),
    );
  });

  // ============================================================
  // 08 Push notification
  // ============================================================

  it('08 Push notification contract', async () => {
    const res = await request(apiUrl())
      .post('/push-notifications/test')
      .set(auth(tenantToken));

    statusOk(res);
  });

  // ============================================================
  // 09 Admin
  // ============================================================

  it('09 Admin → users → properties → reviews → visits → billing', async () => {
    const admin = await login(
      process.env.E2E_ADMIN_LOGIN!,
      process.env.E2E_ADMIN_PASSWORD!,
    );

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
      await request(apiUrl())
        .get(route)
        .set(auth(token))
        .expect(200);
    }
  });

  // ============================================================
  // 10 Lease
  // ============================================================

  it('10 Lease API gate', async () => {
    const res = await request(apiUrl())
      .get('/leases')
      .set(auth(tenantToken));

    if (res.status === 404) {
      throw new Error(
        'Release blocked: Lease Prisma model exists, but /leases controller/module is missing.',
      );
    }

    expect([200, 401, 403]).toContain(res.status);
  });
});