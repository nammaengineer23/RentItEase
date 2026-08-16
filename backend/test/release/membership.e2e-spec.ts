import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, extractData, login, statusOk } from './helpers';

describe('Release E2E • Membership', () => {
  it('plan → membership → activation → expiry/renewal', async () => {
    const loginResult = await login(
      process.env.E2E_TENANT_LOGIN!,
      process.env.E2E_TENANT_PASSWORD!,
    );
    const user = extractData(loginResult.body)?.user ?? extractData(loginResult.body);
    const userId = user?.id;
    if (!userId) throw new Error('Unable to determine tenant user ID.');

    const code = 'PREMIUM';
    const createPlan = await request(apiUrl())
      .post('/membership/plans')
      .send({
        name: `E2E Premium ${Date.now()}`,
        code,
        description: 'Release E2E plan',
        price: 1,
        durationDays: 1,
      });
    statusOk(createPlan);
    const plan = extractData(createPlan.body);
    const planId = plan?.id;
    expect(planId).toBeTruthy();

    const createMembership = await request(apiUrl())
      .post(`/membership/users/${userId}`)
      .send({ planId, autoRenew: false, notes: 'Release E2E' });
    statusOk(createMembership);
    const membership = extractData(createMembership.body);
    const membershipId = membership?.id;
    expect(membershipId).toBeTruthy();
    process.env.E2E_MEMBERSHIP_ID = membershipId!;

    const activate = await request(apiUrl())
      .patch(`/membership/${membershipId}/activate`);
    statusOk(activate);
    expect(extractData(activate.body)?.status).toBe('ACTIVE');

    const expire = await request(apiUrl())
      .patch(`/membership/${membershipId}/expire`);
    statusOk(expire);
    expect(extractData(expire.body)?.status).toBe('EXPIRED');

    const renew = await request(apiUrl())
      .patch(`/membership/${membershipId}/renew`);
    statusOk(renew);
    expect(extractData(renew.body)?.status).toBe('ACTIVE');
  });
});
