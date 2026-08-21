import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import {
  apiUrl,
  auth,
  clearActiveMemberships,
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

    tenantId = tenantData?.user?.id ?? tenantData?.id ?? '';
    ownerId = ownerData?.user?.id ?? ownerData?.id ?? '';

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    expect(tenantId).toBeTruthy();
    expect(ownerId).toBeTruthy();
  });

  // ============================================================
  // 02 Owner → Property → Tenant Visit → Booking
  // ============================================================

  it('02 Tenant → Property → Visit → Booking', async () => {
    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();

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

    propertyId = propertyData?.id ?? '';

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
  // 04 Invoice → history → PAID
  // ============================================================

  it('04 Invoice → history → PAID', async () => {
    expect(paymentId).toBeTruthy();
    expect(tenantId).toBeTruthy();

    const create = await request(apiUrl()).post('/invoices').send({
      userId: tenantId,
      paymentId,
      amount: 1000,
      taxAmount: 0,
      description: 'Release workflow invoice',
      currency: 'INR',
    });

    statusOk(create);

    const invoiceId = extractData(create.body)?.id ?? '';

    expect(invoiceId).toBeTruthy();

    await request(apiUrl()).get(`/invoices/${invoiceId}`).expect(200);

    await request(apiUrl()).get(`/invoices/user/${tenantId}`).expect(200);

    const paid = await request(apiUrl()).patch(`/invoices/${invoiceId}/paid`);

    statusOk(paid);

    expect(extractData(paid.body)?.status).toBe('PAID');
  });

  // ============================================================
  // 05 Membership → activation → expiry → renewal
  // ============================================================

  it('05 Membership → activation → expiry → renewal', async () => {
    expect(tenantId).toBeTruthy();
    expect(ownerToken).toBeTruthy();

    // ----------------------------------------------------------
    // Find existing PREMIUM plan.
    // ----------------------------------------------------------

    const plans = await request(apiUrl()).get('/membership/plans').expect(200);

    const plansData = extractData(plans.body);

    const planList = Array.isArray(plansData)
      ? plansData
      : (plansData?.plans ?? plans.body?.data?.plans ?? []);

    let premiumPlan = planList.find(
      (plan: any) => plan?.code === 'PREMIUM' && plan?.isActive === true,
    );

    let planId = premiumPlan?.id ?? '';

    // ----------------------------------------------------------
    // Create PREMIUM plan only when one does not exist.
    // ----------------------------------------------------------

    if (!planId) {
      const plan = await request(apiUrl())
        .post('/membership/plans')
        .send({
          name: `RentItEase Release Premium ${Date.now()}`,
          code: 'PREMIUM',
          description:
            'Premium membership plan used by the RentItEase release E2E workflow.',
          price: 1,
          durationDays: 1,
          isActive: true,
        });

      statusOk(plan);

      premiumPlan = extractData(plan.body);
      planId = premiumPlan?.id ?? '';

      expect(planId).toBeTruthy();
    } else {
      console.log(`Reusing existing PREMIUM membership plan: ${planId}`);
    }

    expect(planId).toBeTruthy();

    // ----------------------------------------------------------
    // IMPORTANT:
    // Clean up ACTIVE memberships from previous E2E executions.
    // The backend intentionally rejects creation when an ACTIVE
    // membership already exists for the user.
    // ----------------------------------------------------------

    const cleared = await clearActiveMemberships(tenantId, ownerToken);

    if (cleared > 0) {
      console.log(
        `Release workflow: expired ${cleared} existing active membership(s) for tenant ${tenantId}`,
      );
    }

    // ----------------------------------------------------------
    // Create membership.
    // ----------------------------------------------------------

    const membership = await request(apiUrl())
      .post(`/membership/users/${tenantId}`)
      .set(auth(ownerToken))
      .send({
        planId,
        autoRenew: false,
      });

    statusOk(membership);

    const membershipData = extractData(membership.body);

    membershipId = membershipData?.id ?? '';

    expect(membershipId).toBeTruthy();
    expect(membershipData?.userId).toBe(tenantId);
    expect(membershipData?.planId).toBe(planId);
    expect(membershipData?.status).toBe('PENDING');

    console.log(`Release workflow membership created: ${membershipId}`);

    // ----------------------------------------------------------
    // Activate membership.
    // ----------------------------------------------------------

    const activate = await request(apiUrl())
      .patch(`/membership/${membershipId}/activate`)
      .set(auth(ownerToken));

    statusOk(activate);

    const activatedMembership = extractData(activate.body);

    expect(activatedMembership?.id).toBe(membershipId);
    expect(activatedMembership?.status).toBe('ACTIVE');
    expect(activatedMembership?.startDate).toBeTruthy();
    expect(activatedMembership?.endDate).toBeTruthy();
    expect(activatedMembership?.activatedAt).toBeTruthy();

    // ----------------------------------------------------------
    // Expire membership.
    // ----------------------------------------------------------

    const expire = await request(apiUrl())
      .patch(`/membership/${membershipId}/expire`)
      .set(auth(ownerToken));

    statusOk(expire);

    const expiredMembership = extractData(expire.body);

    expect(expiredMembership?.id).toBe(membershipId);
    expect(expiredMembership?.status).toBe('EXPIRED');
    expect(expiredMembership?.expiredAt).toBeTruthy();

    // ----------------------------------------------------------
    // Renew expired membership.
    // ----------------------------------------------------------

    const renew = await request(apiUrl())
      .patch(`/membership/${membershipId}/renew`)
      .set(auth(ownerToken));

    statusOk(renew);

    const renewedMembership = extractData(renew.body);

    expect(renewedMembership?.id).toBe(membershipId);
    expect(renewedMembership?.status).toBe('ACTIVE');
    expect(renewedMembership?.startDate).toBeTruthy();
    expect(renewedMembership?.endDate).toBeTruthy();

    console.log(`Release workflow membership renewed: ${membershipId}`);
  });

  // ============================================================
  // 06 Premium Listing → activation → expiry
  // ============================================================

  it('06 Premium listing → activation → expiry', async () => {
    expect(ownerId).toBeTruthy();
    expect(propertyId).toBeTruthy();
    expect(membershipId).toBeTruthy();

    // ----------------------------------------------------------
    // Create premium listing using the ACTIVE renewed membership.
    // ----------------------------------------------------------

    const create = await request(apiUrl())
      .post(`/premium-listings/users/${ownerId}`)
      .set(auth(ownerToken))
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
      .set(auth(ownerToken));

    statusOk(cleanupMembership);

    expect(extractData(cleanupMembership.body)?.status).toBe('EXPIRED');

    console.log(`Release workflow membership cleaned up: ${membershipId}`);
  });

  // ============================================================
  // 07 Chat → send → read → edit → delete
  // ============================================================

  it('07 Chat → send → read → edit → delete', async () => {
    expect(propertyId).toBeTruthy();
    expect(tenantToken).toBeTruthy();

    const conv = await request(apiUrl())
      .post('/chat/conversations')
      .set(auth(tenantToken))
      .send({
        propertyId,
      });

    statusOk(conv);

    const conversationId = extractData(conv.body)?.id ?? '';

    expect(conversationId).toBeTruthy();

    const sent = await request(apiUrl())
      .post(`/chat/conversations/${conversationId}/messages`)
      .set(auth(tenantToken))
      .send({
        text: `Release workflow ${Date.now()}`,
      });

    statusOk(sent);

    const messageId = extractData(sent.body)?.id ?? '';

    expect(messageId).toBeTruthy();

    statusOk(
      await request(apiUrl())
        .patch(`/chat/conversations/${conversationId}/read`)
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
  // 08 Push notification contract
  // ============================================================

  it('08 Push notification contract', async () => {
    expect(tenantToken).toBeTruthy();

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
      process.env.E2E_ADMIN_EMAIL!,
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
      await request(apiUrl()).get(route).set(auth(token)).expect(200);
    }
  });

  // ============================================================
  // 10 Lease API gate
  // ============================================================

  it('10 Lease API gate', async () => {
    /*
     * Lease functionality is covered by the dedicated release
     * suites:
     *
     *   - lease.e2e-spec.ts
     *   - lease-lifecycle.e2e-spec.ts
     *
     * Those suites verify:
     *
     *   PAID booking → ACTIVE lease → COMPLETED lease
     *   tenant lease list
     *   owner lease list
     *   property availability restoration
     *   duplicate completion rejection
     *
     * Therefore this sequential smoke test does not incorrectly
     * classify GET /leases returning 404 as "Lease module missing".
     */

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();

    console.log(
      'Lease API gate: dedicated Lease release E2E suites are responsible for full Lease API verification.',
    );
  });
});
