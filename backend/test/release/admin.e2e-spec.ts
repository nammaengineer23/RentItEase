import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, auth, extractData, login, statusOk } from './helpers';

describe('Release E2E • Admin', () => {
  it('users → properties → reviews → visits → billing', async () => {
    const admin = await login(
      process.env.E2E_ADMIN_EMAIL ?? process.env.E2E_ADMIN_LOGIN!,
      process.env.E2E_ADMIN_PASSWORD!,
    );
    const token = admin.token;

    await request(apiUrl()).get('/admin/dashboard').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/users').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/properties').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/reviews').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/visits').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/analytics').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/social-media/settings').set(auth(token)).expect(200);

    await request(apiUrl()).get('/admin/billing/memberships').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/billing/premium-listings').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/billing/payments').set(auth(token)).expect(200);
    await request(apiUrl()).get('/admin/billing/invoices').set(auth(token)).expect(200);
  });
});
