import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, extractData, login, statusOk } from './helpers';

describe('Release E2E • Premium Listing', () => {
  it('purchase → activation → expiry', async () => {
    const loginResult = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );
    const user = extractData(loginResult.body)?.user ?? extractData(loginResult.body);
    const userId = user?.id;
    const membershipId = process.env.E2E_MEMBERSHIP_ID;
    if (!userId || !membershipId) {
      throw new Error('Run Membership E2E first so E2E_MEMBERSHIP_ID is available.');
    }

    const create = await request(apiUrl())
      .post(`/premium-listings/users/${userId}`)
      .send({
        propertyId: process.env.E2E_PROPERTY_ID,
        membershipId,
        durationDays: 1,
        amount: 1,
        currency: 'INR',
      });
    statusOk(create);
    const listing = extractData(create.body);
    const listingId = listing?.id;
    expect(listingId).toBeTruthy();

    const activate = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/activate`);
    statusOk(activate);
    expect(extractData(activate.body)?.status).toBe('ACTIVE');

    const status = await request(apiUrl())
      .get(`/premium-listings/property/${process.env.E2E_PROPERTY_ID}/status`)
      .expect(200);
    expect(JSON.stringify(status.body)).toContain('true');

    const expire = await request(apiUrl())
      .patch(`/premium-listings/${listingId}/expire`);
    statusOk(expire);
    expect(extractData(expire.body)?.status).toBe('EXPIRED');
  });
});
