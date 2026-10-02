import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import {
  apiUrl,
  auth,
  createApprovedE2EProperty,
  extractData,
  login,
  statusOk,
} from './helpers';

describe('Release E2E • Premium Listing', () => {
  it('purchase → activation → expiry', async () => {
    const ownerLogin = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );
    const adminLogin = await login(
      process.env.E2E_ADMIN_EMAIL!,
      process.env.E2E_ADMIN_PASSWORD!,
    );

    const ownerToken = ownerLogin.token;
    const adminToken = adminLogin.token;
    expect(ownerToken).toBeTruthy();
    expect(adminToken).toBeTruthy();

    const ownerData = extractData(ownerLogin.body)?.user ?? extractData(ownerLogin.body);
    const ownerId =
      ownerData?.id ?? ownerLogin.body?.user?.id ?? ownerLogin.body?.id ?? '';
    expect(ownerId).toBeTruthy();

    const plansResponse = await request(apiUrl())
      .get('/membership/plans')
      .set(auth(ownerToken))
      .expect(200);
    const plansData = extractData(plansResponse.body);
    const plans = Array.isArray(plansData)
      ? plansData
      : (plansData?.plans ?? plansResponse.body?.plans ?? []);
    const premiumPlan = plans.find(
      (plan: any) => plan?.code === 'PREMIUM' && plan?.isActive === true,
    );
    expect(premiumPlan?.id).toBeTruthy();

    const activeMembershipResponse = await request(apiUrl())
      .get(`/membership/users/${ownerId}/active`)
      .set(auth(adminToken));

    if (activeMembershipResponse.status !== 200) {
      console.warn(
        'Skipping premium listing lifecycle: owner has no active verified membership.',
      );
      return;
    }

    const activeMembership = extractData(activeMembershipResponse.body);
    if (!activeMembership?.id || activeMembership.status !== 'ACTIVE') {
      console.warn(
        'Skipping premium listing lifecycle: owner has no active verified membership.',
      );
      return;
    }

    const membershipId = activeMembership.id;
    const propertyId = await createApprovedE2EProperty(
      ownerToken,
      adminToken,
      'Release Premium Listing',
    );

    const existingListing = await request(apiUrl())
      .get(`/premium-listings/property/${propertyId}/active`)
      .set(auth(ownerToken));

    if (existingListing.status === 200) {
      const existingListingId = extractData(existingListing.body)?.id ?? '';
      if (existingListingId) {
        statusOk(
          await request(apiUrl())
            .patch(`/premium-listings/${existingListingId}/expire`)
            .set(auth(ownerToken)),
        );
      }
    }

    const create = await request(apiUrl())
      .post(`/premium-listings/users/${ownerId}`)
      .set(auth(ownerToken))
      .send({
        propertyId,
        membershipId,
        durationDays: 1,
        currency: 'INR',
      });
    statusOk(create);

    const listing = extractData(create.body);
    const listingId = listing?.id ?? '';
    expect(listingId).toBeTruthy();
    expect(listing.userId).toBe(ownerId);
    expect(listing.propertyId).toBe(propertyId);
    expect(listing.membershipId).toBe(membershipId);

    const activate = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/activate`)
      .set(auth(ownerToken));
    statusOk(activate);

    const activatedListing = extractData(activate.body);
    expect(activatedListing?.id).toBe(listingId);
    expect(activatedListing?.status).toBe('ACTIVE');

    const propertyStatus = await request(apiUrl())
      .get(`/premium-listings/property/${propertyId}/status`)
      .set(auth(ownerToken))
      .expect(200);
    expect(JSON.stringify(propertyStatus.body)).toContain('true');

    const activePropertyListing = await request(apiUrl())
      .get(`/premium-listings/property/${propertyId}/active`)
      .set(auth(ownerToken))
      .expect(200);
    const activePropertyData = extractData(activePropertyListing.body);
    expect(activePropertyData?.id).toBe(listingId);
    expect(activePropertyData?.status).toBe('ACTIVE');

    const getListing = await request(apiUrl())
      .get(`/premium-listings/${listingId}`)
      .set(auth(ownerToken))
      .expect(200);
    const retrievedListing = extractData(getListing.body);
    expect(retrievedListing?.id).toBe(listingId);
    expect(retrievedListing?.status).toBe('ACTIVE');

    const expire = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/expire`)
      .set(auth(ownerToken));
    statusOk(expire);

    const expiredListing = extractData(expire.body);
    expect(expiredListing?.id).toBe(listingId);
    expect(expiredListing?.status).toBe('EXPIRED');

    const persisted = await request(apiUrl())
      .get(`/premium-listings/${listingId}`)
      .set(auth(ownerToken))
      .expect(200);
    const persistedListing = extractData(persisted.body);
    expect(persistedListing?.id).toBe(listingId);
    expect(persistedListing?.status).toBe('EXPIRED');

    const finalPropertyStatus = await request(apiUrl())
      .get(`/premium-listings/property/${propertyId}/status`)
      .set(auth(ownerToken))
      .expect(200);
    expect(JSON.stringify(finalPropertyStatus.body)).not.toContain('"isActive":true');
  });
});
