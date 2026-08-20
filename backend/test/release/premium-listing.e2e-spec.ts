import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import { apiUrl, auth, extractData, login, statusOk } from './helpers';

describe('Release E2E • Premium Listing', () => {
  it('purchase → activation → expiry', async () => {
    // ============================================================
    // 1. OWNER LOGIN
    // ============================================================

    const ownerLogin = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );

    const ownerToken = ownerLogin.token;

    expect(ownerToken).toBeTruthy();

    const ownerData =
      extractData(ownerLogin.body)?.user ?? extractData(ownerLogin.body);

    const ownerId =
      ownerData?.id ?? ownerLogin.body?.user?.id ?? ownerLogin.body?.id ?? '';

    expect(ownerId).toBeTruthy();

    console.log('✓ Owner login successful');
    console.log('  Owner:', process.env.E2E_OWNER_EMAIL);
    console.log('  Owner ID:', ownerId);

    // ============================================================
    // 2. FIND / REUSE PREMIUM MEMBERSHIP PLAN
    // ============================================================

    const plansResponse = await request(apiUrl())
      .get('/membership/plans')
      .set(auth(ownerToken))
      .expect(200);

    const plansData = extractData(plansResponse.body);

    const plans = Array.isArray(plansData)
      ? plansData
      : (plansData?.plans ?? plansResponse.body?.plans ?? []);

    expect(Array.isArray(plans)).toBe(true);

    const premiumPlan = plans.find(
      (plan: any) => plan?.code === 'PREMIUM' && plan?.isActive === true,
    );

    expect(premiumPlan).toBeTruthy();
    expect(premiumPlan.id).toBeTruthy();

    const planId = premiumPlan.id;

    console.log('✓ PREMIUM membership plan found');
    console.log('  Plan ID:', planId);

    // ============================================================
    // 3. FIND / REUSE ACTIVE OWNER MEMBERSHIP
    //
    // Release environments are persistent. The owner may already
    // have an ACTIVE membership from a previous E2E run.
    //
    // Therefore:
    //   - reuse existing ACTIVE membership
    //   - otherwise create a new membership
    // ============================================================

    let membershipId = '';
    let membershipStatus = '';
    let membershipWasReused = false;

    const existingActiveMembershipResponse = await request(apiUrl())
      .get(`/membership/users/${ownerId}/active`)
      .set(auth(ownerToken));

    console.log(
      'EXISTING ACTIVE MEMBERSHIP STATUS:',
      existingActiveMembershipResponse.status,
    );

    console.log(
      'EXISTING ACTIVE MEMBERSHIP RESPONSE:',
      JSON.stringify(existingActiveMembershipResponse.body, null, 2),
    );

    if (existingActiveMembershipResponse.status === 200) {
      const existingMembership = extractData(
        existingActiveMembershipResponse.body,
      );

      if (existingMembership?.id && existingMembership?.status === 'ACTIVE') {
        membershipId = existingMembership.id;
        membershipStatus = existingMembership.status;
        membershipWasReused = true;

        console.log(`✓ Reusing existing ACTIVE membership ${membershipId}`);
      }
    }

    // ============================================================
    // 4. CREATE MEMBERSHIP IF NO ACTIVE MEMBERSHIP EXISTS
    // ============================================================

    if (!membershipId) {
      const createMembership = await request(apiUrl())
        .post(`/membership/users/${ownerId}`)
        .set(auth(ownerToken))
        .send({
          planId,
        });

      console.log(
        'PREMIUM LISTING MEMBERSHIP CREATE STATUS:',
        createMembership.status,
      );

      console.log(
        'PREMIUM LISTING MEMBERSHIP CREATE RESPONSE:',
        JSON.stringify(createMembership.body, null, 2),
      );

      expect([200, 201]).toContain(createMembership.status);

      const createdMembership = extractData(createMembership.body);

      expect(createdMembership).toBeTruthy();

      membershipId = createdMembership?.id;

      expect(membershipId).toBeTruthy();
      expect(createdMembership.userId).toBe(ownerId);
      expect(createdMembership.planId).toBe(planId);

      membershipStatus = createdMembership.status ?? '';

      console.log(`✓ New membership created: ${membershipId}`);
    }

    expect(membershipId).toBeTruthy();

    // ============================================================
    // 5. ACTIVATE OWNER MEMBERSHIP IF NECESSARY
    //
    // If the membership was reused, it is already ACTIVE.
    // Do not call activate again unnecessarily.
    // ============================================================

    if (membershipStatus !== 'ACTIVE') {
      const activateMembership = await request(apiUrl())
        .patch(`/membership/${membershipId}/activate`)
        .set(auth(ownerToken));

      console.log(
        'PREMIUM LISTING MEMBERSHIP ACTIVATE STATUS:',
        activateMembership.status,
      );

      console.log(
        'PREMIUM LISTING MEMBERSHIP ACTIVATE RESPONSE:',
        JSON.stringify(activateMembership.body, null, 2),
      );

      expect([200, 201]).toContain(activateMembership.status);

      const activeMembership = extractData(activateMembership.body);

      expect(activeMembership).toBeTruthy();
      expect(activeMembership.id).toBe(membershipId);
      expect(activeMembership.userId).toBe(ownerId);
      expect(activeMembership.status).toBe('ACTIVE');

      membershipStatus = 'ACTIVE';

      console.log(`✓ Membership activated: ${membershipId}`);
    } else {
      console.log(`✓ Membership already ACTIVE: ${membershipId}`);
    }

    // ============================================================
    // 6. VERIFY ACTIVE MEMBERSHIP ENDPOINT
    // ============================================================

    const activeMembershipResponse = await request(apiUrl())
      .get(`/membership/users/${ownerId}/active`)
      .set(auth(ownerToken))
      .expect(200);

    console.log(
      'PREMIUM LISTING ACTIVE MEMBERSHIP STATUS:',
      activeMembershipResponse.status,
    );

    console.log(
      'PREMIUM LISTING ACTIVE MEMBERSHIP RESPONSE:',
      JSON.stringify(activeMembershipResponse.body, null, 2),
    );

    const verifiedMembership = extractData(activeMembershipResponse.body);

    expect(verifiedMembership).toBeTruthy();
    expect(verifiedMembership.id).toBe(membershipId);
    expect(verifiedMembership.userId).toBe(ownerId);
    expect(verifiedMembership.status).toBe('ACTIVE');

    console.log('✓ Active membership verified');
    console.log('  Membership ID:', membershipId);

    // ============================================================
    // 7. PROPERTY
    // ============================================================

    const propertyId = process.env.E2E_PROPERTY_ID;

    expect(propertyId).toBeTruthy();

    console.log('✓ E2E property configured');
    console.log('  Property ID:', propertyId);

    // ============================================================
    // 8. CREATE / PURCHASE PREMIUM LISTING
    // ============================================================

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

    console.log('PREMIUM LISTING CREATE STATUS:', create.status);

    console.log(
      'PREMIUM LISTING CREATE RESPONSE:',
      JSON.stringify(create.body, null, 2),
    );

    statusOk(create);

    const listing = extractData(create.body);

    expect(listing).toBeTruthy();

    const listingId = listing?.id;

    expect(listingId).toBeTruthy();

    expect(listing.userId).toBe(ownerId);
    expect(listing.propertyId).toBe(propertyId);
    expect(listing.membershipId).toBe(membershipId);

    console.log(`✓ Premium listing created: ${listingId}`);

    // ============================================================
    // 9. ACTIVATE PREMIUM LISTING
    // ============================================================

    const activate = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/activate`)
      .set(auth(ownerToken));

    console.log('PREMIUM LISTING ACTIVATE STATUS:', activate.status);

    console.log(
      'PREMIUM LISTING ACTIVATE RESPONSE:',
      JSON.stringify(activate.body, null, 2),
    );

    statusOk(activate);

    const activatedListing = extractData(activate.body);

    expect(activatedListing).toBeTruthy();
    expect(activatedListing.id).toBe(listingId);
    expect(activatedListing.status).toBe('ACTIVE');

    console.log(`✓ Premium listing activated: ${listingId}`);

    // ============================================================
    // 10. VERIFY PROPERTY PREMIUM STATUS
    // ============================================================

    const propertyStatus = await request(apiUrl())
      .get(`/premium-listings/property/${propertyId}/status`)
      .set(auth(ownerToken))
      .expect(200);

    console.log(
      'PREMIUM LISTING PROPERTY STATUS RESPONSE:',
      JSON.stringify(propertyStatus.body, null, 2),
    );

    expect(JSON.stringify(propertyStatus.body)).toContain('true');

    console.log('✓ Property premium status is active');

    // ============================================================
    // 11. VERIFY ACTIVE LISTING FOR PROPERTY
    // ============================================================

    const activePropertyListing = await request(apiUrl())
      .get(`/premium-listings/property/${propertyId}/active`)
      .set(auth(ownerToken))
      .expect(200);

    const activePropertyData = extractData(activePropertyListing.body);

    expect(activePropertyData).toBeTruthy();
    expect(activePropertyData.id).toBe(listingId);
    expect(activePropertyData.status).toBe('ACTIVE');

    console.log('✓ Active premium listing verified for property');

    // ============================================================
    // 12. GET LISTING BY ID
    // ============================================================

    const getListing = await request(apiUrl())
      .get(`/premium-listings/${listingId}`)
      .set(auth(ownerToken))
      .expect(200);

    const retrievedListing = extractData(getListing.body);

    expect(retrievedListing).toBeTruthy();
    expect(retrievedListing.id).toBe(listingId);
    expect(retrievedListing.status).toBe('ACTIVE');

    console.log('✓ Premium listing retrieval verified');

    // ============================================================
    // 13. EXPIRE PREMIUM LISTING
    // ============================================================

    const expire = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/expire`)
      .set(auth(ownerToken));

    console.log('PREMIUM LISTING EXPIRE STATUS:', expire.status);

    console.log(
      'PREMIUM LISTING EXPIRE RESPONSE:',
      JSON.stringify(expire.body, null, 2),
    );

    statusOk(expire);

    const expiredListing = extractData(expire.body);

    expect(expiredListing).toBeTruthy();
    expect(expiredListing.id).toBe(listingId);
    expect(expiredListing.status).toBe('EXPIRED');

    console.log(`✓ Premium listing expired: ${listingId}`);

    // ============================================================
    // 14. VERIFY PERSISTED EXPIRED LISTING
    // ============================================================

    const persisted = await request(apiUrl())
      .get(`/premium-listings/${listingId}`)
      .set(auth(ownerToken))
      .expect(200);

    const persistedListing = extractData(persisted.body);

    expect(persistedListing).toBeTruthy();
    expect(persistedListing.id).toBe(listingId);
    expect(persistedListing.status).toBe('EXPIRED');

    console.log('✓ EXPIRED listing remains persisted');

    // ============================================================
    // 15. VERIFY PROPERTY IS NO LONGER PREMIUM ACTIVE
    // ============================================================

    const finalPropertyStatus = await request(apiUrl())
      .get(`/premium-listings/property/${propertyId}/status`)
      .set(auth(ownerToken))
      .expect(200);

    console.log(
      'PREMIUM LISTING FINAL PROPERTY STATUS:',
      JSON.stringify(finalPropertyStatus.body, null, 2),
    );

    const finalPropertyStatusJson = JSON.stringify(finalPropertyStatus.body);

    expect(finalPropertyStatusJson).not.toContain('"isActive":true');

    console.log('✓ Property is no longer premium-active');

    // ============================================================
    // FINAL SUMMARY
    // ============================================================

    console.log('');
    console.log('==============================================');
    console.log(' RentItEase Premium Listing E2E completed');
    console.log('==============================================');
    console.log('Owner authenticated:', Boolean(ownerToken));
    console.log('Premium plan verified:', Boolean(planId));
    console.log('Membership reused:', membershipWasReused);
    console.log('Membership verified ACTIVE:', membershipStatus === 'ACTIVE');
    console.log('Premium listing created:', Boolean(listingId));
    console.log(
      'Premium listing expired:',
      expiredListing.status === 'EXPIRED',
    );
    console.log(
      'Property premium status cleared:',
      !finalPropertyStatusJson.includes('"isActive":true'),
    );
    console.log('==============================================');
  });
});
