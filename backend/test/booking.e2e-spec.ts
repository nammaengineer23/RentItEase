import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

describe('Booking E2E', () => {
  // ============================================================
  // Configuration
  // ============================================================

  const baseUrl =
    process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  const apiPrefix = process.env.E2E_API_PREFIX || '/api/v1';

  const apiUrl = `${baseUrl}${apiPrefix}`;

  // ============================================================
  // E2E configuration
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
  let bookingId = '';

  // ============================================================
  // Helpers
  // ============================================================

  function requireEnvironment(): void {
    const missing: string[] = [];

    if (!tenantEmail) missing.push('E2E_TENANT_EMAIL');
    if (!tenantPassword) missing.push('E2E_TENANT_PASSWORD');
    if (!ownerEmail) missing.push('E2E_OWNER_EMAIL');
    if (!ownerPassword) missing.push('E2E_OWNER_PASSWORD');
    if (!propertyId) missing.push('E2E_PROPERTY_ID');

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

  function extractToken(body: any): string {
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

  function unwrapData(body: any): any {
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

  function extractEntity(body: any): any {
    const unwrapped = unwrapData(body);

    if (
      unwrapped &&
      typeof unwrapped === 'object' &&
      !Array.isArray(unwrapped) &&
      unwrapped.id
    ) {
      return unwrapped;
    }

    const candidates = [
      body?.booking,
      body?.visit,

      body?.data?.booking,
      body?.data?.visit,

      body?.data?.data?.booking,
      body?.data?.data?.visit,
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

  function extractArray(body: any): any[] {
    if (Array.isArray(body)) {
      return body;
    }

    if (Array.isArray(body?.bookings)) {
      return body.bookings;
    }

    if (Array.isArray(body?.data)) {
      return body.data;
    }

    if (Array.isArray(body?.data?.bookings)) {
      return body.data.bookings;
    }

    if (Array.isArray(body?.data?.data)) {
      return body.data.data;
    }

    if (Array.isArray(body?.data?.data?.bookings)) {
      return body.data.data.bookings;
    }

    return [];
  }

  function futureVisitDate(minutesFromNow = 30): string {
    return new Date(
      Date.now() + minutesFromNow * 60 * 1000,
    ).toISOString();
  }

  function requireTenantToken(): void {
    if (!tenantToken) {
      throw new Error('Tenant JWT is missing.');
    }
  }

  function requireOwnerToken(): void {
    if (!ownerToken) {
      throw new Error('Owner JWT is missing.');
    }
  }

  function requireVisitId(): void {
    if (!visitId) {
      throw new Error('Visit ID is missing.');
    }
  }

  function requireBookingId(): void {
    if (!bookingId) {
      throw new Error('Booking ID is missing.');
    }
  }

  // ============================================================
  // Setup
  // ============================================================

  beforeAll(() => {
    requireEnvironment();

    console.log('');
    console.log('==============================================');
    console.log(' RentItEase Booking E2E Test');
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

    tenantToken = extractToken(response.body);

    expect(tenantToken).toBeTruthy();

    console.log('✓ Tenant login successful');
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

    ownerToken = extractToken(response.body);

    expect(ownerToken).toBeTruthy();

    console.log('✓ Owner login successful');
  });

  // ============================================================
  // 3. Tenant creates a fresh property visit
  // ============================================================

  it('3. Tenant can create a property visit', async () => {
    requireTenantToken();

    const response = await request(apiUrl)
      .post('/property-visits')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId,
        visitDate: futureVisitDate(30),
        notes: 'Booking E2E Test Visit',
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

    expect(response.body.success).toBe(true);

    const visit = extractEntity(response.body);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          'Unable to extract visit from response.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    visitId = visit.id;

    expect(visitId).toBeTruthy();
    expect(visit.propertyId).toBe(propertyId);
    expect(visit.status).toBe('PENDING');

    console.log(`✓ Visit created: ${visitId}`);
    console.log('  Status: PENDING');
  });

  // ============================================================
  // 4. Owner approves the visit
  // ============================================================

  it('4. Owner can approve the visit', async () => {
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

    const visit = extractEntity(response.body);

    expect(visit).toBeTruthy();

    if (!visit) {
      throw new Error(
        [
          'Unable to extract approved visit.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(visit.id).toBe(visitId);
    expect(visit.status).toBe('APPROVED');

    console.log('✓ Owner approved visit');
  });

  // ============================================================
  // 5. Tenant creates booking from approved visit
  // ============================================================

  it('5. Tenant can create booking from approved visit', async () => {
    requireTenantToken();
    requireVisitId();

    const response = await request(apiUrl)
      .post('/bookings')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        visitId,
        notes: 'Automated Booking E2E Test',
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

    expect(response.body.success).toBe(true);

    const booking = extractEntity(response.body);

    expect(booking).toBeTruthy();

    if (!booking) {
      throw new Error(
        [
          'Unable to extract booking from response.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    bookingId = booking.id;

    expect(bookingId).toBeTruthy();
    expect(booking.visitId).toBe(visitId);

    if (booking.status !== undefined) {
      expect(booking.status).toBe('PENDING');
    }

    console.log(`✓ Booking created: ${bookingId}`);
    console.log(`  Status: ${booking.status}`);
  });

  // ============================================================
  // 6. Owner can see booking
  // ============================================================

  it('6. Owner can see booking request', async () => {
    requireOwnerToken();
    requireBookingId();

    const response = await request(apiUrl)
      .get('/bookings/owner')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const bookings = extractArray(response.body);

    expect(Array.isArray(bookings)).toBe(true);

    const booking = bookings.find((item) => item?.id === bookingId);

    expect(booking).toBeTruthy();

    if (!booking) {
      throw new Error(
        [
          `Booking ${bookingId} was not found in owner bookings.`,
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(booking.id).toBe(bookingId);
    expect(booking.visitId).toBe(visitId);

    console.log('✓ Owner can see booking');
  });

  // ============================================================
  // 7. Owner approves booking
  // ============================================================

  it('7. Owner can approve booking', async () => {
    requireOwnerToken();
    requireBookingId();

    const response = await request(apiUrl)
      .patch(`/bookings/${bookingId}/approve`)
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

    const booking = extractEntity(response.body);

    expect(booking).toBeTruthy();

    if (!booking) {
      throw new Error(
        [
          'Unable to extract approved booking.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(booking.id).toBe(bookingId);
    expect(booking.status).toBe('APPROVED');

    console.log('✓ Owner approved booking');
    console.log('  Status: APPROVED');
  });

  // ============================================================
  // 8. Tenant retrieves approved booking
  // ============================================================

  it('8. Tenant can retrieve approved booking', async () => {
    requireTenantToken();
    requireBookingId();

    const response = await request(apiUrl)
      .get(`/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const booking = extractEntity(response.body);

    expect(booking).toBeTruthy();

    if (!booking) {
      throw new Error(
        [
          'Unable to extract booking detail.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(booking.id).toBe(bookingId);
    expect(booking.visitId).toBe(visitId);
    expect(booking.status).toBe('APPROVED');

    console.log('✓ Tenant retrieved APPROVED booking');
  });

  // ============================================================
  // 9. Tenant moves booking to PAYMENT_PENDING
  // ============================================================

  it('9. Tenant can move approved booking to payment pending', async () => {
    requireTenantToken();
    requireBookingId();

    const response = await request(apiUrl)
      .patch(`/bookings/${bookingId}/payment-pending`)
      .set('Authorization', `Bearer ${tenantToken}`)
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

    const booking = extractEntity(response.body);

    expect(booking).toBeTruthy();

    if (!booking) {
      throw new Error(
        [
          'Unable to extract payment-pending booking.',
          '',
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    expect(booking.id).toBe(bookingId);
    expect(booking.status).toBe('PAYMENT_PENDING');

    console.log('✓ Booking moved to PAYMENT_PENDING');
  });

  // ============================================================
  // Summary
  // ============================================================

  afterAll(() => {
    console.log('');
    console.log('==============================================');
    console.log(' Booking E2E workflow completed');
    console.log('==============================================');
    console.log(` Tenant authenticated: ${Boolean(tenantToken)}`);
    console.log(` Owner authenticated: ${Boolean(ownerToken)}`);
    console.log(` Visit created: ${Boolean(visitId)}`);
    console.log(` Booking created: ${Boolean(bookingId)}`);

    if (visitId) {
      console.log(` Visit ID: ${visitId}`);
    }

    if (bookingId) {
      console.log(` Booking ID: ${bookingId}`);
    }

    console.log('==============================================');
    console.log('');
  });
});