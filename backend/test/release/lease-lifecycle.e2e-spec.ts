import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import {
  apiUrl,
  auth,
  extractData,
  login,
} from './helpers';

describe('Release E2E • Lease Lifecycle', () => {
  let tenantToken = '';
  let ownerToken = '';
  let leaseId = '';

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
  });

  // ============================================================
  // 2. FIND ACTIVE LEASE
  // ============================================================

  it('2. find active lease for lifecycle testing', async () => {
    expect(tenantToken).toBeTruthy();

    const configuredLeaseId = process.env.E2E_LEASE_ID;

    if (configuredLeaseId) {
      const res = await request(apiUrl())
        .get(`/leases/${configuredLeaseId}`)
        .set(auth(tenantToken))
        .expect(200);

      const lease = extractData(res.body);

      expect(lease).toBeTruthy();
      expect(lease.id).toBe(configuredLeaseId);

      if (lease.status !== 'ACTIVE') {
        throw new Error(
          `E2E_LEASE_ID=${configuredLeaseId} is ${lease.status}, but lifecycle testing requires ACTIVE.`,
        );
      }

      leaseId = configuredLeaseId;
      return;
    }

    const res = await request(apiUrl())
      .get('/leases/my')
      .set(auth(tenantToken))
      .expect(200);

    const data = extractData(res.body);

    const leases = Array.isArray(data)
      ? data
      : data?.leases ?? res.body?.leases ?? [];

    const activeLease = leases.find(
      (lease: any) => lease?.status === 'ACTIVE',
    );

    expect(activeLease?.id).toBeTruthy();

    leaseId = activeLease.id;
  });

  // ============================================================
  // 3. VERIFY OWNER ACCESS
  // ============================================================

  it('3. owner can retrieve the active lease', async () => {
    expect(ownerToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/leases/${leaseId}`)
      .set(auth(ownerToken))
      .expect(200);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('ACTIVE');
  });

  // ============================================================
  // 4. COMPLETE LEASE
  // ============================================================

  it('4. owner can complete an ACTIVE lease', async () => {
    expect(ownerToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/leases/${leaseId}/complete`)
      .set(auth(ownerToken));

    expect([200, 201]).toContain(res.status);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('COMPLETED');
  });

  // ============================================================
  // 5. VERIFY COMPLETED LEASE
  // ============================================================

  it('5. completed lease remains persisted as COMPLETED', async () => {
    expect(tenantToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get(`/leases/${leaseId}`)
      .set(auth(tenantToken))
      .expect(200);

    const lease = extractData(res.body);

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('COMPLETED');
    expect(lease.completedAt).toBeTruthy();
  });

  // ============================================================
  // 6. VERIFY COMPLETED LEASE IN TENANT LIST
  // ============================================================

  it('6. tenant lease list contains the completed lease', async () => {
    expect(tenantToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .get('/leases/my')
      .set(auth(tenantToken))
      .expect(200);

    const data = extractData(res.body);

    const leases = Array.isArray(data)
      ? data
      : data?.leases ?? res.body?.leases ?? [];

    const lease = leases.find(
      (item: any) => item?.id === leaseId,
    );

    expect(lease).toBeTruthy();
    expect(lease.id).toBe(leaseId);
    expect(lease.status).toBe('COMPLETED');
  });

  // ============================================================
  // 7. COMPLETED LEASE CANNOT BE COMPLETED AGAIN
  // ============================================================

  it('7. completed lease cannot be completed again', async () => {
    expect(ownerToken).toBeTruthy();
    expect(leaseId).toBeTruthy();

    const res = await request(apiUrl())
      .patch(`/leases/${leaseId}/complete`)
      .set(auth(ownerToken));

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
