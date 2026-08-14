import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

describe('Property Visits E2E', () => {
  // ============================================================
  // Configuration
  // ============================================================

  const baseUrl =
    process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  const apiPrefix = process.env.E2E_API_PREFIX || '/api/v1';

  /*
   * IMPORTANT:
   *
   * baseUrl = http://localhost:3000
   * apiPrefix = /api/v1
   *
   * apiUrl = http://localhost:3000/api/v1
   */
  const apiUrl = `${baseUrl}${apiPrefix}`;

  // ============================================================
  // Test accounts / property
  // ============================================================

  const tenantEmail = process.env.E2E_TENANT_EMAIL;
  const tenantPassword = process.env.E2E_TENANT_PASSWORD;

  const ownerEmail = process.env.E2E_OWNER_EMAIL;
  const ownerPassword = process.env.E2E_OWNER_PASSWORD;

  const propertyId = process.env.E2E_PROPERTY_ID;

  // ============================================================
  // Runtime state
  // ============================================================

  let tenantToken = '';
  let ownerToken = '';

  let visitId = '';

  // ============================================================
  // Environment validation
  // ============================================================

  function requireEnvironment(): void {
    const missing: string[] = [];

    if (!tenantEmail) {
      missing.push('E2E_TENANT_EMAIL');
    }

    if (!tenantPassword) {
      missing.push('E2E_TENANT_PASSWORD');
    }

    if (!ownerEmail) {
      missing.push('E2E_OWNER_EMAIL');
    }

    if (!ownerPassword) {
      missing.push('E2E_OWNER_PASSWORD');
    }

    if (!propertyId) {
      missing.push('E2E_PROPERTY_ID');
    }

    if (missing.length > 0) {
      throw new Error(
        [
          'Missing required E2E environment variables:',
          '',
          ...missing.map((name) => `  ${name}`),
          '',
          'Configure them in test/.env.e2e before running the test.',
        ].join('\n'),
      );
    }
  }

  // ============================================================
  // JWT extraction
  // ============================================================

  function extractToken(body: any): string {
    /*
     * Supports all of these possible response structures:
     *
     * {
     *   accessToken: "..."
     * }
     *
     * {
     *   data: {
     *     accessToken: "..."
     *   }
     * }
     *
     * {
     *   data: {
     *     data: {
     *       accessToken: "..."
     *     }
     *   }
     * }
     */

    const possibleTokens = [
      body?.accessToken,
      body?.access_token,
      body?.token,

      body?.data?.accessToken,
      body?.data?.access_token,
      body?.data?.token,

      body?.data?.data?.accessToken,
      body?.data?.data?.access_token,
      body?.data?.data?.token,
    ];

    const token = possibleTokens.find(
      (value) => typeof value === 'string' && value.length > 0,
    );

    if (!token) {
      throw new Error(
        [
          'Unable to extract JWT token from login response.',
          '',
          JSON.stringify(body, null, 2),
        ].join('\n'),
      );
    }

    return token;
  }

  // ============================================================
  // Generic response unwrapping
  // ============================================================

  function unwrapData(body: any): any {
    /*
     * The backend currently has service responses such as:
     *
     * {
     *   success: true,
     *   message: 'Visit request created successfully.',
     *   data: visit
     * }
     *
     * If the global response interceptor wraps this again,
     * we may receive:
     *
     * {
     *   success: true,
     *   timestamp: '...',
     *   data: {
     *     success: true,
     *     message: '...',
     *     data: visit
     *   }
     * }
     *
     * This function safely unwraps nested `data` properties.
     */

    let current = body;

    for (let i = 0; i < 5; i += 1) {
      if (
        current &&
        typeof current === 'object' &&
        !Array.isArray(current) &&
        current.data !== undefined
      ) {
        current = current.data;
        continue;
      }

      break;
    }

    return current;
  }

  // ============================================================
  // Extract a single visit
  // ============================================================

  function extractVisit(body: any): any {
    /*
     * First try the normal nested-data structure.
     */
    const unwrapped = unwrapData(body);

    if (
      unwrapped &&
      typeof unwrapped === 'object' &&
      !Array.isArray(unwrapped) &&
      unwrapped.id
    ) {
      return unwrapped;
    }

    /*
     * Additional compatibility cases.
     */
    const candidates = [
      body?.visit,
      body?.data?.visit,
      body?.data?.data?.visit,

      body?.data,
      body?.data?.data,
    ];

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === 'object' &&
        !Array.isArray(candidate) &&
        candidate.id
      ) {
        return candidate;
      }
    }

    return undefined;
  }

  // ============================================================
  // Extract visit array
  // ============================================================

  function extractVisits(body: any): any[] {
    /*
     * Current backend:
     *
     * GET /property-visits
     * -> returns an array
     *
     * GET /property-visits/owner
     * -> returns an array
     *
     * But this helper also supports wrapped responses.
     */

    if (Array.isArray(body)) {
      return body;
    }

    if (Array.isArray(body?.visits)) {
      return body.visits;
    }

    if (Array.isArray(body?.data)) {
      return body.data;
    }

    if (Array.isArray(body?.data?.visits)) {
      return body.data.visits;
    }

    if (Array.isArray(body?.data?.data)) {
      return body.data.data;
    }

    if (Array.isArray(body?.data?.data?.visits)) {
      return body.data.data.visits;
    }

    return [];
  }

  // ============================================================
  // Future visit date
  // ============================================================

  function futureVisitDate(minutesFromNow = 30): string {
    return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
  }

  // ============================================================
  // Require authentication
  // ============================================================

  function requireTenantToken(): void {
    if (!tenantToken) {
      throw new Error(
        'Tenant JWT is missing. Tenant login must succeed first.',
      );
    }
  }

  function requireOwnerToken(): void {
    if (!ownerToken) {
      throw new Error('Owner JWT is missing. Owner login must succeed first.');
    }
  }

  // ============================================================
  // Require visit
  // ============================================================

  function requireVisitId(): void {
    if (!visitId) {
      throw new Error(
        'Visit ID is missing. The property visit creation test must succeed first.',
      );
    }
  }

  // ============================================================
  // Before all tests
  // ============================================================

  beforeAll(() => {
    requireEnvironment();

    console.log('');
    console.log('==============================================');
    console.log(' RentItEase Property Visits E2E Test');
    console.log('==============================================');
    console.log(`Base URL: ${baseUrl}`);
    console.log(`API Prefix: ${apiPrefix}`);
    console.log(`API: ${apiUrl}`);
    console.log(`Property: ${propertyId}`);
    console.log('==============================================');
    console.log('');
  });

  // ============================================================
  // 1. Tenant Login
  // ============================================================

  it('1. Tenant can login', async () => {
    const response = await request(apiUrl)
      .post('/auth/login')
      .send({
        login: tenantEmail,
        password: tenantPassword,
      })
      .expect(201);

    expect(response.body).toBeTruthy();

    tenantToken = extractToken(response.body);

    expect(tenantToken).toBeTruthy();

    console.log('✓ Tenant login successful');
    console.log(`  Tenant: ${tenantEmail}`);
  });

  // ============================================================
  // 2. Owner Login
  // ============================================================

  it('2. Owner can login', async () => {
    const response = await request(apiUrl)
      .post('/auth/login')
      .send({
        login: ownerEmail,
        password: ownerPassword,
      })
      .expect(201);

    expect(response.body).toBeTruthy();

    ownerToken = extractToken(response.body);

    expect(ownerToken).toBeTruthy();

    console.log('✓ Owner login successful');
    console.log(`  Owner: ${ownerEmail}`);
  });

  // ============================================================
  // 3. Tenant books visit
  // ============================================================

  it('3. Tenant can book a property visit', async () => {
    requireTenantToken();

    const visitDate = futureVisitDate(30);

    const response = await request(apiUrl)
      .post('/property-visits')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId,
        visitDate,
        notes: 'Automated Property Visit E2E Test',
      })
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(
            [
              `Unexpected status ${res.status}`,
              '',
              JSON.stringify(res.body, null, 2),
            ].join('\n'),
          );
        }
      });

    expect(response.body).toBeTruthy();

    console.log('');
    console.log('Property visit creation response:');
    console.log(JSON.stringify(response.body, null, 2));
    console.log('');

    expect(response.body.success).toBe(true);

    const visit = extractVisit(response.body);

    /*
     * The previous version failed here because it treated the
     * outer `data` wrapper as the visit itself.
     *
     * The new extractVisit() unwraps nested data until it reaches
     * the actual PropertyVisit object.
     */

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          'Property visit was created but the visit object could not',
          'be extracted from the API response.',
          '',
          'Response:',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.id).toBeTruthy();

    visitId = visit.id;

    expect(visit.propertyId).toBe(propertyId);
    expect(visit.status).toBe('PENDING');

    console.log('✓ Tenant booked property visit');
    console.log(`  Visit ID: ${visitId}`);
    console.log(`  Status: ${visit.status}`);
  });

  // ============================================================
  // 4. Tenant can see visit
  // ============================================================

  it('4. Tenant can see the booked visit', async () => {
    requireTenantToken();
    requireVisitId();

    const response = await request(apiUrl)
      .get('/property-visits')
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const visits = extractVisits(response.body);

    expect(Array.isArray(visits)).toBe(true);

    const visit = visits.find((item) => item?.id === visitId);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          `Visit ${visitId} was not found in tenant visit results.`,
          '',
          'Response:',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.propertyId).toBe(propertyId);
    expect(visit.tenantId).toBeTruthy();
    expect(visit.status).toBe('PENDING');

    console.log('✓ Tenant can see PENDING visit');
  });

  // ============================================================
  // 5. Owner can see visit request
  // ============================================================

  it('5. Owner can see the visit request', async () => {
    requireOwnerToken();
    requireVisitId();

    const response = await request(apiUrl)
      .get('/property-visits/owner')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const visits = extractVisits(response.body);

    expect(Array.isArray(visits)).toBe(true);

    const visit = visits.find((item) => item?.id === visitId);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          `Visit ${visitId} was not found in owner visit results.`,
          '',
          'Response:',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.propertyId).toBe(propertyId);
    expect(visit.status).toBe('PENDING');

    console.log('✓ Owner can see PENDING visit request');
  });

  // ============================================================
  // 6. Owner approves visit
  // ============================================================

  it('6. Owner can approve the visit', async () => {
    requireOwnerToken();
    requireVisitId();

    const response = await request(apiUrl)
      .patch(`/property-visits/${visitId}/approve`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(
            [
              `Unexpected status ${res.status}`,
              '',
              JSON.stringify(res.body, null, 2),
            ].join('\n'),
          );
        }
      });

    expect(response.body.success).toBe(true);

    const visit = extractVisit(response.body);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          'Unable to extract approved visit from response.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.id).toBe(visitId);
    expect(visit.status).toBe('APPROVED');

    console.log('✓ Owner approved visit');
    console.log('  Status: APPROVED');
  });

  // ============================================================
  // 7. Tenant sees APPROVED status
  // ============================================================

  it('7. Tenant sees APPROVED status', async () => {
    requireTenantToken();
    requireVisitId();

    const response = await request(apiUrl)
      .get('/property-visits')
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const visits = extractVisits(response.body);

    const visit = visits.find((item) => item?.id === visitId);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          `Visit ${visitId} was not found after approval.`,
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.status).toBe('APPROVED');

    console.log('✓ Tenant sees APPROVED status');
  });

  // ============================================================
  // 8. Owner completes visit
  // ============================================================

  it('8. Owner can complete the approved visit', async () => {
    requireOwnerToken();
    requireVisitId();

    const response = await request(apiUrl)
      .patch(`/property-visits/${visitId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(
            [
              `Unexpected status ${res.status}`,
              '',
              JSON.stringify(res.body, null, 2),
            ].join('\n'),
          );
        }
      });

    expect(response.body.success).toBe(true);

    const visit = extractVisit(response.body);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          'Unable to extract completed visit from response.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.id).toBe(visitId);
    expect(visit.status).toBe('COMPLETED');

    console.log('✓ Owner completed visit');
    console.log('  Status: COMPLETED');
  });

  // ============================================================
  // 9. Tenant sees COMPLETED status
  // ============================================================

  it('9. Tenant sees COMPLETED status', async () => {
    requireTenantToken();
    requireVisitId();

    const response = await request(apiUrl)
      .get('/property-visits')
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const visits = extractVisits(response.body);

    const visit = visits.find((item) => item?.id === visitId);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          `Visit ${visitId} was not found after completion.`,
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.status).toBe('COMPLETED');

    console.log('✓ Tenant sees COMPLETED status');
  });

  // ============================================================
  // 10. Tenant can access own visit
  // ============================================================

  it('10. Tenant access remains authorized for own visit', async () => {
    requireTenantToken();
    requireVisitId();

    const response = await request(apiUrl)
      .get(`/property-visits/${visitId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const visit = extractVisit(response.body);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          'Unable to extract visit from detail response.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.id).toBe(visitId);
    expect(visit.propertyId).toBe(propertyId);

    console.log('✓ Tenant can access own visit');
  });

  // ============================================================
  // Summary
  // ============================================================

  afterAll(() => {
    console.log('');
    console.log('==============================================');
    console.log(' Property Visit E2E workflow completed');
    console.log('==============================================');
    console.log(` Tenant authenticated: ${Boolean(tenantToken)}`);
    console.log(` Owner authenticated: ${Boolean(ownerToken)}`);
    console.log(` Visit created: ${Boolean(visitId)}`);

    if (visitId) {
      console.log(` Visit ID: ${visitId}`);
    }

    console.log('==============================================');
    console.log('');
  });
});
