import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, auth, login, statusOk } from './helpers';

describe('Release E2E • Push Notifications', () => {
  it('register → test → unregister device when a token is supplied', async () => {
    const token = (
      await login(process.env.E2E_TENANT_LOGIN!, process.env.E2E_TENANT_PASSWORD!)
    ).token;
    const deviceToken = process.env.E2E_PUSH_TOKEN;

    if (!deviceToken) {
      // Firebase delivery requires a real FCM registration token. The endpoint
      // contract is still checked by calling the authenticated test endpoint.
      const res = await request(apiUrl())
        .post('/push-notifications/test')
        .set(auth(token));
      statusOk(res);
      return;
    }

    const register = await request(apiUrl())
      .post('/push-notifications/register')
      .set(auth(token))
      .send({
        token: deviceToken,
        platform: 'android',
      });
    statusOk(register);

    const test = await request(apiUrl())
      .post('/push-notifications/test')
      .set(auth(token));
    statusOk(test);

    const unregister = await request(apiUrl())
      .delete('/push-notifications/unregister')
      .set(auth(token))
      .send({ token: deviceToken });
    statusOk(unregister);
  });
});
