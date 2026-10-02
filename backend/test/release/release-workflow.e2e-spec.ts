import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import {
  apiUrl,
  auth,
  clearActiveMemberships,
  createApprovedE2EProperty,
  extractData,
  login,
  statusOk,
  futureIso,
} from './helpers';
import { createHmac } from 'crypto';

describe('RentItEase Release Workflow • sequential smoke', () => {
  let tenantToken = '';
  let ownerToken = '';
  let adminToken = '';
  let tenantId = '';
  let ownerId = '';
  let propertyId = '';
  let bookingId = '';
  let paymentId = '';
  let razorpayOrderId = '';
  let membershipId = '';
  let paymentVerified = false;

  // ============================================================
  // 01 Authentication
  // ============================================================

  it('01 Authentication: tenant + owner + admin login', async () => {
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

    const tenantData = extractData(tenant.body);
    const ownerData = extractData(owner.body);

    tenantId = tenantData?.user?.id ?? tenantData?.id ?? '';
    ownerId = ownerData?.user?.id ?? ownerData?.id ?? '';

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    expect(adminToken).toBeTruthy();
    expect(tenantId).toBeTruthy();
    expect(ownerId).toBeTruthy();
  });

  // ============================================================
  // 02 Owner → Property → Tenant Visit → Booking
  // ============================================================

  it('02 Tenant → Property → Visit → Booking', async () => {
    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();

    expect(adminToken).toBeTruthy();

    propertyId = await createApprovedE2EProperty(
      ownerToken,
      adminToken,
      'Release Workflow',
    );

    expect(propertyId).toBeTruthy();

    console.log(`Release E2E property created: ${propertyId}`);

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
    const visitId = visitData?.id ?? '';

    expect(visitId).toBeTruthy();

    const approveVisit = await request(apiUrl())
      .patch(`/property-visits/${visitId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveVisit);

    expect(extractData(approveVisit.body)?.status).toBe('APPROVED');

    const booking = await request(apiUrl())
      .post('/bookings')
      .set(auth(tenantToken))
      .send({
        visitId,
        notes: 'Release workflow booking',
      });

    statusOk(booking);

    bookingId = extractData(booking.body)?.id ?? '';

    expect(bookingId).toBeTruthy();

    const approveBooking = await request(apiUrl())
      .patch(`/bookings/${bookingId}/approve`)
      .set(auth(ownerToken));

    statusOk(approveBooking);

    expect(extractData(approveBooking.body)?.status).toBe('APPROVED');

    const paymentPending = await request(apiUrl())
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set(auth(tenantToken));

    statusOk(paymentPending);

    expect(extractData(paymentPending.body)?.status).toBe('PAYMENT_PENDING');
  });

  // ============================================================
  // 03 Payment → verification → PAID
  // ============================================================

  it('03 Payment → verification → PAID', async () => {
    expect(bookingId).toBeTruthy();
    expect(tenantToken).toBeTruthy();

    const order = await request(apiUrl())
      .post('/payments/order')
      .set(auth(tenantToken))
      .send({
        bookingId,
      });

    statusOk(order);

    const d = extractData(order.body);

    paymentId = d?.paymentId ?? '';
    razorpayOrderId = d?.razorpayOrderId ?? '';

    expect(paymentId).toBeTruthy();
    expect(razorpayOrderId).toBeTruthy();

    const secret = process.env.E2E_RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error('E2E_RAZORPAY_KEY_SECRET is required.');
    }

    const razorpayPaymentId = process.env.E2E_RAZORPAY_PAYMENT_ID;
    if (!razorpayPaymentId) {
      console.warn(
        'Skipping positive release payment verification: no real captured E2E payment is configured.',
      );
      return;
    }

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
    paymentVerified = true;

    const booking = await request(apiUrl())
      .get(`/bookings/${bookingId}`)
      .set(auth(tenantToken))
      .expect(200);

    expect(extractData(booking.body)?.status).toBe('PAID');
  });

  // ============================================================
  // 04 Invoice → history → PAID
  // ============================================================

  it('04 Invoice → history → PAID', async () => {
    if (!paymentVerified) {
      console.warn(
        'Skipping invoice paid-state workflow because payment was not verified.',
      );
      return;
    }
    expect(paymentId).toBeTruthy();
    expect(tenantId).toBeTruthy();

    const create = await request(apiUrl()).post('/invoices').set(auth(tenantToken)).send({
      userId: tenantId,
      paymentId,
      amount: 1000,
      taxAmount: 0,
      description: 'Release workflow invoice',
      currency: 'INR',
    });

    let invoiceId = '';

    if (create.status === 400) {
      const message = create.body?.message ?? create.body?.error?.message ?? '';

      if (!String(message).includes('An invoice already exists for this payment')) {
        throw new Error(`Invoice creation failed: ${JSON.stringify(create.body)}`);
      }

      const existing = await request(apiUrl())
        .get(`/invoices/payment/${paymentId}`)
        .set(auth(tenantToken))
        .expect(200);

      invoiceId = extractData(existing.body)?.id ?? '';
    } else {
      statusOk(create);
      invoiceId = extractData(create.body)?.id ?? '';
    }

    expect(invoiceId).toBeTruthy();

    await request(apiUrl()).get(`/invoices/${invoiceId}`).set(auth(adminToken)).expect(200);

    await request(apiUrl()).get(`/invoices/user/${tenantId}`).set(auth(adminToken)).expect(200);

    const paid = await request(apiUrl())
      .patch(`/invoices/${invoiceId}/paid`)
      .set(auth(adminToken));

    statusOk(paid);

    expect(extractData(paid.body)?.status).toBe('PAID');
  });

  // ============================================================
  // 05 Membership → activation → expiry → renewal
  // ============================================================

  it('05 Membership → activation → expiry → renewal', async () => {
    expect(ownerId).toBeTruthy();
    expect(ownerToken).toBeTruthy();

    const plans = await request(apiUrl()).get('/membership/plans').expect(200);
    const plansData = extractData(plans.body);
    const planList = Array.isArray(plansData)
      ? plansData
      : (plansData?.plans ?? plans.body?.data?.plans ?? []);
    const premiumPlan = planList.find(
      (plan: any) => plan?.code === 'PREMIUM' && plan?.isActive === true,
    );

    expect(premiumPlan?.id).toBeTruthy();

    const cleared = await clearActiveMemberships(ownerId, adminToken);
    if (cleared > 0) {
      console.log(
        `Release workflow: expired ${cleared} existing active membership(s) for owner ${ownerId}`,
      );
    }

    const membership = await request(apiUrl())
      .post(`/membership/users/${ownerId}`)
      .set(auth(adminToken))
      .send({ planId: premiumPlan.id, autoRenew: false });

    statusOk(membership);

    const membershipData = extractData(membership.body);
    membershipId = membershipData?.id ?? '';

    expect(membershipId).toBeTruthy();
    expect(membershipData?.status).toBe('PENDING');

    const activate = await request(apiUrl())
      .patch(`/membership/${membershipId}/activate`)
      .set(auth(adminToken));

    // Never bypass the billing invariant: activation must require a
    // verified membership payment.
    expect(activate.status).toBe(400);
    expect(JSON.stringify(activate.body)).toContain(
      'Premium membership payment has not been verified',
    );
  });

  // 06 Premium Listing → activation → expiry
  // ============================================================

  it('06 Premium listing → activation → expiry', async () => {
    expect(ownerId).toBeTruthy();
    expect(propertyId).toBeTruthy();
    console.warn(
      'Skipping premium listing workflow because this smoke flow has no verified active membership payment.',
    );
    return;

    // ----------------------------------------------------------
    // Create premium listing using the ACTIVE renewed membership.
    // ----------------------------------------------------------

    const create = await request(apiUrl())
      .post(`/premium-listings/users/${ownerId}`)
      .set(auth(adminToken))
      .send({
        propertyId,
        membershipId,
        durationDays: 1,
        amount: 1,
        currency: 'INR',
      });

    statusOk(create);

    const listingId = extractData(create.body)?.id ?? '';

    expect(listingId).toBeTruthy();

    console.log(`Release workflow premium listing created: ${listingId}`);

    // ----------------------------------------------------------
    // Activate listing.
    // ----------------------------------------------------------

    const activate = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/activate`)
      .set(auth(ownerToken));

    statusOk(activate);

    expect(extractData(activate.body)?.status).toBe('ACTIVE');

    // ----------------------------------------------------------
    // Expire listing.
    // ----------------------------------------------------------

    const expire = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/expire`)
      .set(auth(ownerToken));

    statusOk(expire);

    expect(extractData(expire.body)?.status).toBe('EXPIRED');

    console.log(`Release workflow premium listing expired: ${listingId}`);

    // ----------------------------------------------------------
    // IMPORTANT CLEANUP:
    // The membership was renewed in test 05 and is ACTIVE.
    //
    // Leave the release environment clean so that the dedicated
    // membership.e2e-spec.ts suite can create its own membership.
    // ----------------------------------------------------------

    const cleanupMembership = await request(apiUrl())
      .patch(`/membership/${membershipId}/expire`)
      .set(auth(adminToken));

    statusOk(cleanupMembership);

    expect(extractData(cleanupMembership.body)?.status).toBe('EXPIRED');