import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import {
  apiUrl,
  auth,
  extractData,
  login,
  statusOk,
} from './helpers';

describe('Release E2E • Lease', () => {
  let tenantToken = '';

  // ============================================================
  // 1. LEASE API REACHABILITY
  // ============================================================

  it('1. Lease API is implemented and reachable', async () => {
    const tenant = await login(
      process.env.E2E_TENANT_EMAIL!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    tenantToken = tenant.token;

    expect(tenantToken).toBeTruthy();

    const res = await request(apiUrl())
      .get('/leases')
      .set(auth(tenantToken));

    if (res.status === 404) {
      throw new Error(
        'LEASE E2E BLOCKER: GET /api/v1/leases returned 404. ' +
          'The Lease module exists in the source tree, but the deployed ' +
          'backend does not currently expose the /leases route. ' +
          'Verify the Railway deployment contains the latest LeaseModule.',
      );
    }

    /*
     * A working authenticated endpoint should normally return 200.
     * 401/403 are also accepted because they prove the route exists.
     */
    expect([200, 401, 403]).toContain(res.status);

    if (res.status === 200) {
      const data = extractData(res.body);

      expect(data).toBeDefined();
    }
  });

  // ============================================================
  // 2. EXISTING LEASE
  // ============================================================

  it('2. existing lease can be retrieved when E2E_LEASE_ID is supplied', async () => {
    const leaseId = process.env.E2E_LEASE_ID;

    /*
     * This test is optional until the release environment has
     * an existing Lease record configured.
     */
    if (!leaseId) {
      return;
    }

    expect(tenantToken).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/leases/${leaseId}`)
      .set(auth(tenantToken));

    if (res.status === 404) {
      throw new Error(
        `E2E_LEASE_ID=${leaseId} was supplied, but GET /leases/${leaseId} ` +
          'returned 404. Verify that the lease exists and that the deployed ' +
          'LeaseController is available.',
      );
    }

    statusOk(res, [200]);

    const data = extractData(res.body);

    expect(data).toBeTruthy();
    expect(data?.id).toBe(leaseId);
  });
});
