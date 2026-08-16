import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, login } from './helpers';

describe('Release E2E • Authentication', () => {
  it('login → me', async () => {
    const result = await login(
      process.env.E2E_TENANT_LOGIN!,
      process.env.E2E_TENANT_PASSWORD!,
    );

    expect(result.token).toBeTruthy();

    const me = await request(apiUrl())
      .get('/auth/me')
      .set('Authorization', `Bearer ${result.token}`)
      .expect(200);

    const body = me.body?.data ?? me.body;
    expect(body?.id).toBeTruthy();
  });
});
