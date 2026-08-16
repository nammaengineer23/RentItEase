import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl } from './helpers';

describe('Release E2E • API regression', () => {
  const publicRoutes = [
    '/health',
    '/properties',
    '/membership/plans',
    '/premium-listings/active',
  ];

  for (const route of publicRoutes) {
    it(`GET ${route} is reachable`, async () => {
      const res = await request(apiUrl()).get(route);
      expect(res.status).not.toBe(500);
    });
  }
});
