import {
    describe,
    beforeAll,
    afterAll,
    it,
    expect,
  } from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Authentication E2E', () => {
  let app: INestApplication<App>;

  let registeredEmail: string;
  let registeredPhone: string;
  const password = 'Password@123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Register → Login → Me → Logout → Login again → Me', async () => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    registeredEmail = `e2e.auth.${uniqueSuffix}@example.com`;

    // Indian mobile number with exactly 10 digits after +91.
    const phoneDigits = `8${uniqueSuffix.slice(-9)}`;
    registeredPhone = `+91${phoneDigits}`;

    // ---------------------------------------------------------
    // 1. REGISTER
    // ---------------------------------------------------------

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'RentItEase E2E User',
        email: registeredEmail,
        phone: registeredPhone,
        password,
      })
      .expect(201);

    const registerBody = registerResponse.body?.data ?? registerResponse.body;

    expect(registerBody).toBeDefined();
    expect(registerBody.success).toBe(true);
    expect(registerBody.user).toBeDefined();
    expect(registerBody.user.email).toBe(registeredEmail);
    expect(registerBody.user.phone).toBe(registeredPhone);
    expect(registerBody.accessToken).toBeDefined();
    expect(registerBody.refreshToken).toBeDefined();

    const firstAccessToken = registerBody.accessToken;
    const firstRefreshToken = registerBody.refreshToken;

    expect(typeof firstAccessToken).toBe('string');
    expect(firstAccessToken.length).toBeGreaterThan(20);
    expect(typeof firstRefreshToken).toBe('string');
    expect(firstRefreshToken.length).toBeGreaterThan(20);

    // ---------------------------------------------------------
    // 2. LOGIN
    // ---------------------------------------------------------

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        login: registeredEmail,
        password,
      })
      .expect(201);

    const loginBody = loginResponse.body?.data ?? loginResponse.body;

    expect(loginBody).toBeDefined();
    expect(loginBody.success).toBe(true);
    expect(loginBody.user).toBeDefined();
    expect(loginBody.user.email).toBe(registeredEmail);
    expect(loginBody.accessToken).toBeDefined();
    expect(loginBody.refreshToken).toBeDefined();

    const loginAccessToken = loginBody.accessToken;

    expect(loginAccessToken).not.toBe(firstAccessToken);

    // ---------------------------------------------------------
    // 3. AUTHENTICATED /ME
    // ---------------------------------------------------------

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginAccessToken}`)
      .expect(200);

    const meBody = meResponse.body?.data ?? meResponse.body;

    expect(meBody).toBeDefined();
    expect(meBody.id).toBe(registerBody.user.id);
    expect(meBody.email).toBe(registeredEmail);
    expect(meBody.phone).toBe(registeredPhone);

    // ---------------------------------------------------------
    // 4. LOGOUT
    // ---------------------------------------------------------

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginAccessToken}`)
      .expect(201);

    const logoutBody = logoutResponse.body?.data ?? logoutResponse.body;

    expect(logoutBody).toBeDefined();
    expect(logoutBody.success).toBe(true);

    // ---------------------------------------------------------
    // 5. LOGIN AGAIN
    // ---------------------------------------------------------

    const secondLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        login: registeredEmail,
        password,
      })
      .expect(201);

    const secondLoginBody =
      secondLoginResponse.body?.data ?? secondLoginResponse.body;

    expect(secondLoginBody).toBeDefined();
    expect(secondLoginBody.success).toBe(true);
    expect(secondLoginBody.user).toBeDefined();
    expect(secondLoginBody.user.email).toBe(registeredEmail);
    expect(secondLoginBody.accessToken).toBeDefined();
    expect(secondLoginBody.refreshToken).toBeDefined();

    const secondAccessToken = secondLoginBody.accessToken;
    const secondRefreshToken = secondLoginBody.refreshToken;

    expect(secondAccessToken).not.toBe(loginAccessToken);
    expect(secondAccessToken).not.toBe(firstAccessToken);

    expect(secondRefreshToken).toBeDefined();
    expect(secondRefreshToken).not.toBe(firstRefreshToken);

    // ---------------------------------------------------------
    // 6. AUTHENTICATED /ME AFTER SECOND LOGIN
    // ---------------------------------------------------------

    const secondMeResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .expect(200);

    const secondMeBody = secondMeResponse.body?.data ?? secondMeResponse.body;

    expect(secondMeBody).toBeDefined();
    expect(secondMeBody.id).toBe(registerBody.user.id);
    expect(secondMeBody.email).toBe(registeredEmail);
    expect(secondMeBody.phone).toBe(registeredPhone);
  });
});
