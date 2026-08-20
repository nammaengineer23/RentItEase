import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import { apiUrl, auth, extractData, login } from './helpers';

describe('Release E2E • Membership', () => {
  let tenantToken = '';
  let ownerToken = '';

  let tenantUserId = '';
  let planId = '';
  let membershipId = '';

  // ============================================================
  // TEST DATA
  // ============================================================
  // Membership plan code is restricted by the backend DTO to:
  // FREE | PREMIUM
  //
  // Therefore, keep code as PREMIUM and make the plan NAME unique.
  const uniquePlanName = `RentItEase E2E Plan ${Date.now()}`;
  const planCode = 'PREMIUM';

  // ============================================================
  // 1. LOGIN
  // ============================================================

  it('1. tenant + owner login', async () => {
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

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();

    tenantUserId =
      tenant.data?.user?.id ??
      tenant.data?.id ??
      tenant.body?.user?.id ??
      tenant.body?.id ??
      '';

    expect(tenantUserId).toBeTruthy();
  });

  // ============================================================
  // 2. MEMBERSHIP API REACHABILITY
  // ============================================================

  it('2. membership plans API is implemented and reachable', async () => {
    expect(tenantToken).toBeTruthy();

    const res = await request(apiUrl())
      .get('/membership/plans')
      .set(auth(tenantToken));

    if (res.status === 404) {
      throw new Error(
        'MEMBERSHIP E2E BLOCKER: GET /api/v1/membership/plans returned 404. ' +
          'Verify that the deployed Railway backend contains MembershipModule.',
      );
    }

    expect([200, 401, 403]).toContain(res.status);
  });

  // ============================================================
  // 3. CREATE MEMBERSHIP PLAN
  // ============================================================

  it('3. find/reuse PREMIUM membership plan', async () => {
    expect(ownerToken).toBeTruthy();

    const res = await request(apiUrl())
      .get('/membership/plans')
      .set(auth(ownerToken))
      .expect(200);

    const data = extractData(res.body);

    const plans = Array.isArray(data)
      ? data
      : (data?.plans ?? res.body?.plans ?? []);

    expect(Array.isArray(plans)).toBe(true);

    const plan = plans.find(
      (item: any) => item?.code === 'PREMIUM' && item?.isActive === true,
    );

    expect(plan).toBeTruthy();

    planId = plan.id;

    expect(planId).toBeTruthy();
    expect(plan.code).toBe('PREMIUM');
    expect(plan.isActive).toBe(true);
  });
  // ============================================================
  // 4. GET PLAN
  // ============================================================

  it('4. retrieve membership plan', async () => {
    expect(tenantToken).toBeTruthy();
    expect(planId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/membership/plans/${planId}`)
      .set(auth(tenantToken))
      .expect(200);

    const plan = extractData(res.body);

    expect(plan).toBeTruthy();
    expect(plan.id).toBe(planId);
    expect(plan.code).toBe('PREMIUM');
    expect(plan.isActive).toBe(true);
    expect(plan.isActive).toBe(true);
  });

  // ============================================================
  // 5. PLAN LIST
  // ============================================================

  it('5. membership plan list contains the created plan', async () => {
    expect(tenantToken).toBeTruthy();
    expect(planId).toBeTruthy();

    const res = await request(apiUrl())
      .get('/membership/plans')
      .set(auth(tenantToken))
      .expect(200);

    const data = extractData(res.body);

    const plans = Array.isArray(data)
      ? data
      : (data?.plans ?? res.body?.plans ?? []);

    expect(Array.isArray(plans)).toBe(true);

    const plan = plans.find((item: any) => item?.id === planId);

    expect(plan).toBeTruthy();
    expect(plan.id).toBe(planId);
    expect(plan.code).toBe('PREMIUM');
    expect(plan.isActive).toBe(true);
  });

  // ============================================================
  // 6. CREATE MEMBERSHIP FOR TENANT
  // ============================================================

  it('6. create membership for tenant', async () => {
    expect(ownerToken).toBeTruthy();
    expect(tenantUserId).toBeTruthy();
    expect(planId).toBeTruthy();

    const res = await request(apiUrl())
      .post(`/membership/users/${tenantUserId}`)
      .set(auth(ownerToken))
      .send({
        planId,
      });

    expect([200, 201]).toContain(res.status);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();

    membershipId = membership?.id ?? '';

    expect(membershipId).toBeTruthy();
    expect(membership.userId).toBe(tenantUserId);
    expect(membership.planId).toBe(planId);
    expect(membership.status).toBe('PENDING');
  });

  // ============================================================
  // 7. GET USER MEMBERSHIPS
  // ============================================================

  it('7. tenant membership list contains the membership', async () => {
    expect(tenantToken).toBeTruthy();
    expect(tenantUserId).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/membership/users/${tenantUserId}`)
      .set(auth(tenantToken))
      .expect(200);

    const data = extractData(res.body);

    const memberships = Array.isArray(data)
      ? data
      : (data?.memberships ?? res.body?.memberships ?? []);

    expect(Array.isArray(memberships)).toBe(true);

    const membership = memberships.find(
      (item: any) => item?.id === membershipId,
    );

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
    expect(membership.planId).toBe(planId);
    expect(membership.status).toBe('PENDING');
  });

  // ============================================================
  // 8. GET MEMBERSHIP BY ID
  // ============================================================

  it('8. retrieve membership by ID', async () => {
    expect(tenantToken).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/membership/${membershipId}`)
      .set(auth(tenantToken))
      .expect(200);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
    expect(membership.userId).toBe(tenantUserId);
    expect(membership.planId).toBe(planId);
    expect(membership.status).toBe('PENDING');
  });

  // ============================================================
  // 9. ACTIVATE MEMBERSHIP
  // ============================================================

  it('9. activate membership', async () => {
    expect(ownerToken).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/membership/${membershipId}/activate`)
      .set(auth(ownerToken));

    expect([200, 201]).toContain(res.status);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
    expect(membership.status).toBe('ACTIVE');
    expect(membership.startDate).toBeTruthy();
    expect(membership.endDate).toBeTruthy();
    expect(membership.activatedAt).toBeTruthy();
  });

  // ============================================================
  // 10. GET ACTIVE MEMBERSHIP
  // ============================================================

  it('10. active membership endpoint returns the membership', async () => {
    expect(tenantToken).toBeTruthy();
    expect(tenantUserId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/membership/users/${tenantUserId}/active`)
      .set(auth(tenantToken))
      .expect(200);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
    expect(membership.status).toBe('ACTIVE');
  });

  // ============================================================
  // 11. AUTO-RENEW
  // ============================================================

  it('11. update membership auto-renew', async () => {
    expect(ownerToken).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/membership/${membershipId}/auto-renew`)
      .set(auth(ownerToken))
      .send({
        autoRenew: true,
      });

    expect([200, 201]).toContain(res.status);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
  });

  // ============================================================
  // 12. RENEW MEMBERSHIP
  // ============================================================

  it('12. renew active membership', async () => {
    expect(ownerToken).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/membership/${membershipId}/renew`)
      .set(auth(ownerToken));

    expect([200, 201]).toContain(res.status);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
    expect(membership.status).toBe('ACTIVE');
    expect(membership.endDate).toBeTruthy();
  });

  // ============================================================
  // 13. CANCEL MEMBERSHIP
  // ============================================================

  it('13. cancel membership', async () => {
    expect(ownerToken).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/membership/${membershipId}/cancel`)
      .set(auth(ownerToken));

    expect([200, 201]).toContain(res.status);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
    expect(membership.status).toBe('CANCELLED');
    expect(membership.cancelledAt).toBeTruthy();
  });

  // ============================================================
  // 14. VERIFY CANCELLED MEMBERSHIP
  // ============================================================

  it('14. cancelled membership remains persisted', async () => {
    expect(tenantToken).toBeTruthy();
    expect(membershipId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/membership/${membershipId}`)
      .set(auth(tenantToken))
      .expect(200);

    const membership = extractData(res.body);

    expect(membership).toBeTruthy();
    expect(membership.id).toBe(membershipId);
    expect(membership.status).toBe('CANCELLED');
    expect(membership.cancelledAt).toBeTruthy();
  });
});
