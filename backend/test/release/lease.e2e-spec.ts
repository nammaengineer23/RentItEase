import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, auth, login } from './helpers';

describe('Release E2E • Lease', () => {
  it('Lease API is implemented and reachable', async () => {
    const token = (
      await login(process.env.E2E_TENANT_LOGIN!, process.env.E2E_TENANT_PASSWORD!)
    ).token;

    const res = await request(apiUrl())
      .get('/leases')
      .set(auth(token));

    if (res.status === 404) {
      throw new Error(
        'LEASE E2E BLOCKER: /api/v1/leases is not implemented in the supplied backend snapshot. ' +
        'The Prisma Lease model exists, but no leases controller/module was present.',
      );
    }

    expect([200, 401, 403]).toContain(res.status);
  });

  it('existing lease lifecycle when E2E_LEASE_ID is supplied', async () => {
    const leaseId = process.env.E2E_LEASE_ID;
    if (!leaseId) return;

    const token = (
      await login(process.env.E2E_TENANT_LOGIN!, process.env.E2E_TENANT_PASSWORD!)
    ).token;

    const res = await request(apiUrl())
      .get(`/leases/${leaseId}`)
      .set(auth(token));

    if (res.status === 404) {
      throw new Error('E2E_LEASE_ID was supplied but the lease route returned 404.');
    }

    expect(res.status).toBe(200);
  });
});
