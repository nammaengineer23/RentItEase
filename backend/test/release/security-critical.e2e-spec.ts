import request from 'supertest';
import { describe, expect, it } from '@jest/globals';

import { apiUrl, auth, extractData, login } from './helpers';

describe('Release E2E • Critical security boundaries', () => {
  let tenantToken = '';
  let ownerToken = '';
  let adminToken = '';
  let ownerId = '';

  it('1. authenticates tenant, owner and admin fixtures', async () => {
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

    ownerId = extractData(owner.body)?.id ?? extractData(owner.body)?.user?.id ?? '';

    expect(tenantToken).toBeTruthy();
    expect(ownerToken).toBeTruthy();
    expect(adminToken).toBeTruthy();
    expect(ownerId).toBeTruthy();
  });

  it('2. rejects missing and invalid JWTs on protected endpoints', async () => {
    await request(apiUrl()).get('/bookings/tenant').expect(401);

    await request(apiUrl())
      .get('/bookings/tenant')
      .set('Authorization', 'Bearer definitely-not-a-jwt')
      .expect(401);

    await request(apiUrl())
      .post('/uploads/image')
      .expect(401);

    await request(apiUrl())
      .post('/uploads/file')
      .expect(401);

    await request(apiUrl())
      .post('/property-images/not-a-real-property/video')
      .expect(401);

    await request(apiUrl())
      .post('/payments/order')
      .send({ bookingId: 'not-a-real-booking' })
      .expect(401);

    await request(apiUrl())
      .get('/chat/conversations')
      .expect(401);
  });

  it('3. blocks tenant/owner role escalation into admin-only APIs', async () => {
    await request(apiUrl())
      .get('/admin/dashboard')
      .set(auth(tenantToken))
      .expect(403);

    await request(apiUrl())
      .get('/admin/dashboard')
      .set(auth(ownerToken))
      .expect(403);

    await request(apiUrl())
      .get('/admin/social-media/settings')
      .set(auth(tenantToken))
      .expect(403);

    await request(apiUrl())
      .get('/admin/social-media/settings')
      .set(auth(ownerToken))
      .expect(403);

    await request(apiUrl())
      .patch('/admin/users/not-a-real-user/role')
      .set(auth(ownerToken))
      .send({ role: 'ADMIN' })
      .expect(403);

    await request(apiUrl())
      .post('/invoices')
      .set(auth(ownerToken))
      .send({
        userId: ownerId,
        amount: 1,
        taxAmount: 0,
        currency: 'INR',
      })
      .expect(403);
  });

  it('4. blocks direct invoice user-ID substitution', async () => {
    // The owner ID is real, but the tenant is not allowed to substitute it
    // into the tenant-scoped invoice endpoint.
    const response = await request(apiUrl())
      .get(`/invoices/user/${ownerId}`)
      .set(auth(tenantToken));

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).toContain('access');
  });

  it('5. keeps admin-only invoice mutations protected even with an arbitrary ID', async () => {
    await request(apiUrl())
      .patch('/invoices/not-a-real-invoice/paid')
      .set(auth(tenantToken))
      .expect(403);

    await request(apiUrl())
      .patch('/invoices/not-a-real-invoice/cancel')
      .set(auth(ownerToken))
      .expect(403);
  });

  it('6. keeps the signed payment webhook public but rejects unsigned/tampered events', async () => {
    const payload = JSON.stringify({
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay-security-test',
            order_id: 'order-security-test',
            status: 'captured',
          },
        },
      },
    });

    const response = await request(apiUrl())
      .post('/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', '0'.repeat(64))
      .set('x-razorpay-event-id', `security-test-${Date.now()}`)
      .send(payload);

    expect([400, 403]).toContain(response.status);
  });

  it('7. allows the authenticated admin boundary to be reached', async () => {
    const response = await request(apiUrl())
      .get('/admin/dashboard')
      .set(auth(adminToken));

    expect(response.status).toBe(200);
  });
  it('8. lets admins activate/deactivate users and change owner role', async () => {
    await request(apiUrl())
      .patch(`/admin/status/userActive/${ownerId}`)
      .set(auth(adminToken))
      .send({ field: 'isActive', value: false })
      .expect(200);

    await request(apiUrl())
      .patch(`/admin/status/userActive/${ownerId}`)
      .set(auth(adminToken))
      .send({ field: 'isActive', value: true })
      .expect(200);

    await request(apiUrl())
      .patch(`/admin/status/user/${ownerId}`)
      .set(auth(adminToken))
      .send({ field: 'role', value: 'OWNER' })
      .expect(200);
  });

  it('9. lets admins override property conditions without using owner APIs', async () => {
    const { createApprovedE2EProperty } = await import('./helpers');
    const propertyId = await createApprovedE2EProperty(
      ownerToken,
      adminToken,
      'Security Status Override',
    );

    await request(apiUrl())
      .patch(`/admin/status/propertyAvailable/${propertyId}`)
      .set(auth(adminToken))
      .send({ field: 'isAvailable', value: false })
      .expect(200);

    await request(apiUrl())
      .patch(`/admin/status/propertyAvailable/${propertyId}`)
      .set(auth(adminToken))
      .send({ field: 'isAvailable', value: true })
      .expect(200);
  });

  it('10. rejects unsupported status targets and invalid status values', async () => {
    await request(apiUrl())
      .patch('/admin/status/unknown/not-real')
      .set(auth(adminToken))
      .send({ field: 'status', value: 'ACTIVE' })
      .expect(400);

    await request(apiUrl())
      .patch(`/admin/status/user/${ownerId}`)
      .set(auth(adminToken))
      .send({ field: 'role', value: 'NOT_A_ROLE' })
      .expect(400);

    await request(apiUrl())
      .patch(`/admin/status/userActive/${ownerId}`)
      .set(auth(adminToken))
      .send({ field: 'isActive', value: 'true' })
      .expect(400);
  });

});
