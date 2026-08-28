import request from 'supertest';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

describe('Property E2E', () => {
  // ============================================================
  // Configuration
  // ============================================================

  const baseUrl =
    process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  const apiPrefix = process.env.E2E_API_PREFIX || '/api/v1';

  const apiUrl = `${baseUrl}${apiPrefix}`;

  // ============================================================
  // Test accounts
  // ============================================================

  const ownerEmail = process.env.E2E_OWNER_EMAIL;
  const ownerPassword = process.env.E2E_OWNER_PASSWORD;

  const tenantEmail = process.env.E2E_TENANT_EMAIL;
  const tenantPassword = process.env.E2E_TENANT_PASSWORD;

  // ============================================================
  // Runtime state
  // ============================================================

  let ownerToken = '';
  let tenantToken = '';

  let propertyId = '';
  let amenityId = '';

  // ============================================================
  // Helpers
  // ============================================================

  function requireEnvironment(): void {
    const missing: string[] = [];

    if (!ownerEmail) {
      missing.push('E2E_OWNER_EMAIL');
    }

    if (!ownerPassword) {
      missing.push('E2E_OWNER_PASSWORD');
    }

    if (!tenantEmail) {
      missing.push('E2E_TENANT_EMAIL');
    }

    if (!tenantPassword) {
      missing.push('E2E_TENANT_PASSWORD');
    }

    if (missing.length > 0) {
      throw new Error(
        [
          'Missing required Property E2E environment variables:',
          '',
          ...missing.map((name) => `  ${name}`),
          '',
          'Configure them in test/.env.e2e before running the Property E2E test.',
        ].join('\n'),
      );
    }
  }

  /**
   * Extract JWT token from the different response-wrapper formats
   * used by the RentItEase API.
   */
  function extractToken(body: any): string {
    const token =
      body?.accessToken ??
      body?.access_token ??
      body?.token ??
      body?.data?.accessToken ??
      body?.data?.access_token ??
      body?.data?.token ??
      body?.data?.data?.accessToken ??
      body?.data?.data?.access_token ??
      body?.data?.data?.token;

    if (!token || typeof token !== 'string') {
      throw new Error(
        [
          'Unable to extract JWT token from login response:',
          JSON.stringify(body, null, 2),
        ].join('\n'),
      );
    }

    return token;
  }

  /**
   * Unwrap common API response envelopes.
   *
   * Supports:
   *
   * body
   * body.data
   * body.data.data
   */
  function extractData(body: any): any {
    if (body?.data?.data !== undefined) {
      return body.data.data;
    }

    if (body?.data !== undefined) {
      return body.data;
    }

    return body;
  }

  /**
   * Extract a property from common response formats.
   */
  function extractProperty(body: any): any {
    if (body?.property) {
      return body.property;
    }

    if (body?.data?.property) {
      return body.data.property;
    }

    if (body?.data?.data?.property) {
      return body.data.data.property;
    }

    const data = extractData(body);

    if (data?.property) {
      return data.property;
    }

    return data;
  }

  /**
   * Extract arrays from common RentItEase response formats.
   *
   * Supports properties, amenities and generic arrays.
   */
  function extractArray(body: any): any[] {
    const candidates = [
      // Direct array
      body,

      // Generic wrappers
      body?.data,
      body?.data?.data,

      // Properties
      body?.properties,
      body?.data?.properties,
      body?.data?.data?.properties,

      // Amenities
      body?.amenities,
      body?.data?.amenities,
      body?.data?.data?.amenities,

      // Other common collection names
      body?.items,
      body?.data?.items,
      body?.data?.data?.items,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    throw new Error(
      [
        'Unable to extract array from API response:',
        JSON.stringify(body, null, 2),
      ].join('\n'),
    );
  }

  /**
   * Extract a property ID from a response.
   */
  function extractId(value: any): string {
    const id =
      value?.id ??
      value?.propertyId ??
      value?.data?.id ??
      value?.data?.propertyId ??
      value?.data?.data?.id ??
      value?.data?.data?.propertyId;

    if (!id || typeof id !== 'string') {
      throw new Error(
        [
          'Unable to extract property ID from response:',
          JSON.stringify(value, null, 2),
        ].join('\n'),
      );
    }

    return id;
  }

  /**
   * Assert that an API response succeeded.
   */
  function assertSuccess(response: request.Response, operation: string): void {
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        [
          `${operation} failed.`,
          `HTTP ${response.status}`,
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    if (response.body?.success === false) {
      throw new Error(
        [
          `${operation} returned success=false.`,
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }
  }

  function requireOwnerToken(): void {
    if (!ownerToken) {
      throw new Error(
        'Owner JWT token is missing. Owner login must succeed first.',
      );
    }
  }

  function requireTenantToken(): void {
    if (!tenantToken) {
      throw new Error(
        'Tenant JWT token is missing. Tenant login must succeed first.',
      );
    }
  }

  function requirePropertyId(): void {
    if (!propertyId) {
      throw new Error(
        'Property ID is missing. Property creation must succeed first.',
      );
    }
  }

  /**
   * Extract pagination from common response formats.
   */
  function extractPagination(body: any): any {
    const candidates = [
      body?.pagination,
      body?.data?.pagination,
      body?.data?.data?.pagination,

      body?.meta,
      body?.data?.meta,
      body?.data?.data?.meta,

      body?.data?.pagination?.pagination,
      body?.data?.data?.pagination?.pagination,
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object') {
        return candidate;
      }
    }

    return undefined;
  }

  /**
   * Extract home sections from common response formats.
   */
  function extractHomeData(body: any): any {
    const candidates = [
      body,
      body?.data,
      body?.data?.data,
      body?.home,
      body?.data?.home,
      body?.data?.data?.home,
    ];

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === 'object' &&
        (candidate.featured !== undefined ||
          candidate.latest !== undefined ||
          candidate.mostFavorited !== undefined ||
          candidate.topRated !== undefined ||
          candidate.popularLocalities !== undefined)
      ) {
        return candidate;
      }
    }

    return extractData(body);
  }

  /**
   * Extract nearby response data.
   */
  function extractNearbyData(body: any): any {
    const candidates = [
      body,
      body?.data,
      body?.data?.data,
      body?.nearby,
      body?.data?.nearby,
      body?.data?.data?.nearby,
    ];

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === 'object' &&
        (candidate.radius !== undefined ||
          candidate.properties !== undefined ||
          candidate.results !== undefined)
      ) {
        return candidate;
      }
    }

    return extractData(body);
  }

  /**
   * Extract a response message from common API wrappers.
   */
  function extractMessage(body: any): string | undefined {
    const candidates = [
      body?.message,
      body?.data?.message,
      body?.data?.data?.message,
      body?.result?.message,
      body?.data?.result?.message,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    return undefined;
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  beforeAll(() => {
    requireEnvironment();

    console.log('');
    console.log('==============================================');
    console.log(' RentItEase Property E2E Test');
    console.log('==============================================');
    console.log(`Base URL: ${baseUrl}`);
    console.log(`API Prefix: ${apiPrefix}`);
    console.log(`API: ${apiUrl}`);
    console.log('==============================================');
    console.log('');
  });

  afterAll(() => {
    console.log('');
    console.log('==============================================');
    console.log(' Property E2E workflow completed');
    console.log('==============================================');
    console.log(`Owner authenticated: ${Boolean(ownerToken)}`);
    console.log(`Tenant authenticated: ${Boolean(tenantToken)}`);
    console.log(`Property created: ${Boolean(propertyId)}`);
    console.log(`Property ID: ${propertyId || 'none'}`);
    console.log('==============================================');
    console.log('');
  });

  // ============================================================
  // 1. Owner login
  // ============================================================

  it('1. Owner can login', async () => {
    const response = await request(apiUrl).post('/auth/login').send({
      login: ownerEmail,
      password: ownerPassword,
    });

    assertSuccess(response, 'Owner login');

    ownerToken = extractToken(response.body);

    expect(ownerToken).toBeTruthy();
  });

  // ============================================================
  // 2. Tenant login
  // ============================================================

  it('2. Tenant can login', async () => {
    const response = await request(apiUrl).post('/auth/login').send({
      login: tenantEmail,
      password: tenantPassword,
    });

    assertSuccess(response, 'Tenant login');

    tenantToken = extractToken(response.body);

    expect(tenantToken).toBeTruthy();
  });

  // ============================================================
  // 3. Owner creates property
  // ============================================================

  it('3. Owner can create a property', async () => {
    requireOwnerToken();

    const payload = {
      title: `Property E2E ${Date.now()}`,
      description:
        'Property created automatically by RentItEase Property E2E testing.',
      price: 25000,
      address: '123 Property E2E Road',
      locality: 'HSR Layout',
      landmark: 'Near E2E Test Point',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560102',
      latitude: 12.9116,
      longitude: 77.6474,
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      propertyType: 'APARTMENT',
      furnishing: 'SEMI_FURNISHED',
      parking: true,
      petFriendly: true,
      securityDeposit: 50000,
      termsAccepted: true,
      termsVersion: '1.0',
    };

    const rejectedWithoutTerms = await request(apiUrl)
      .post('/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ ...payload, termsAccepted: false });

    expect(rejectedWithoutTerms.status).toBe(400);

    const response = await request(apiUrl)
      .post('/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload);

    assertSuccess(response, 'Property creation');

    const property = extractProperty(response.body);

    propertyId = extractId(property);

    expect(propertyId).toBeTruthy();
    expect(property.title).toBe(payload.title);
    expect(property.city).toBe(payload.city);
    expect(property.ownerId ?? property.owner?.id).toBeTruthy();
  });

  // ============================================================
  // 4. Public property list
  // ============================================================

  it('4. Anyone can list properties', async () => {
    const response = await request(apiUrl).get('/properties');

    assertSuccess(response, 'Property list');

    const properties = extractArray(response.body);

    expect(Array.isArray(properties)).toBe(true);

    const pagination = extractPagination(response.body);

    expect(pagination).toBeDefined();

    if (pagination?.total !== undefined) {
      expect(Number(pagination.total)).toBeGreaterThanOrEqual(1);
    } else if (pagination?.totalItems !== undefined) {
      expect(Number(pagination.totalItems)).toBeGreaterThanOrEqual(1);
    } else if (pagination?.count !== undefined) {
      expect(Number(pagination.count)).toBeGreaterThanOrEqual(1);
    } else {
      /*
       * The endpoint successfully returned a collection but did not
       * expose a conventional total field.
       *
       * The collection itself is still validated.
       */
      expect(properties.length).toBeGreaterThanOrEqual(1);
    }
  });

  // ============================================================
  // 5. Property search/filter
  // ============================================================

  it('5. Property search/filter works', async () => {
    requirePropertyId();

    const response = await request(apiUrl).get('/properties').query({
      city: 'Bangalore',
      locality: 'HSR Layout',
      propertyType: 'APARTMENT',
      furnishing: 'SEMI_FURNISHED',
      bedrooms: 2,
      bathrooms: 2,
      minPrice: 10000,
      maxPrice: 50000,
      minArea: 500,
      maxArea: 2000,
      parking: true,
      petFriendly: true,
      isAvailable: true,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
    });

    assertSuccess(response, 'Property filtering');

    const properties = extractArray(response.body);

    expect(Array.isArray(properties)).toBe(true);

    const found = properties.some((property) => property.id === propertyId);

    expect(found).toBe(true);
  });

  // ============================================================
  // 6. Search by text
  // ============================================================

  it('6. Property text search works', async () => {
    requirePropertyId();

    const response = await request(apiUrl).get('/properties').query({
      search: 'HSR',
      page: 1,
      limit: 10,
    });

    assertSuccess(response, 'Property text search');

    const properties = extractArray(response.body);

    expect(Array.isArray(properties)).toBe(true);
  });

  // ============================================================
  // 7. Get property by ID
  // ============================================================

  it('7. Anyone can get property details by ID', async () => {
    requirePropertyId();

    const response = await request(apiUrl).get(`/properties/${propertyId}`);

    assertSuccess(response, 'Get property by ID');

    const property = extractProperty(response.body);

    expect(property.id).toBe(propertyId);
    expect(property.title).toBeTruthy();
    expect(property.owner).toBeDefined();
    expect(property.images).toBeDefined();
    expect(property.amenities).toBeDefined();
  });

  // ============================================================
  // 8. Non-existent property
  // ============================================================

  it('8. Non-existent property returns 404', async () => {
    const response = await request(apiUrl).get(
      '/properties/non-existent-property-id',
    );

    expect(response.status).toBe(404);
  });

  // ============================================================
  // 9. Owner my-properties
  // ============================================================

  it('9. Owner can see my properties', async () => {
    requireOwnerToken();
    requirePropertyId();

    const response = await request(apiUrl)
      .get('/properties/my-properties')
      .set('Authorization', `Bearer ${ownerToken}`);

    assertSuccess(response, 'Owner my-properties');

    const properties = extractArray(response.body);

    expect(Array.isArray(properties)).toBe(true);

    const found = properties.some((property) => property.id === propertyId);

    expect(found).toBe(true);
  });

  // ============================================================
  // 10. Tenant cannot access owner-only my-properties
  // ============================================================

  it('10. Tenant cannot access another owner my-properties as owner', async () => {
    requireTenantToken();

    const response = await request(apiUrl)
      .get('/properties/my-properties')
      .set('Authorization', `Bearer ${tenantToken}`);

    /*
     * Endpoint currently only has JwtAuthGuard, not RolesGuard.
     *
     * Therefore a tenant may legitimately receive an empty list.
     *
     * The important security requirement is that the tenant
     * must not receive the owner's property.
     */

    assertSuccess(response, 'Tenant my-properties');

    const properties = extractArray(response.body);

    expect(properties.some((property) => property.id === propertyId)).toBe(
      false,
    );
  });

  // ============================================================
  // 11. Home endpoint
  // ============================================================

  it('11. Home endpoint returns property sections', async () => {
    const response = await request(apiUrl).get('/properties/home');

    assertSuccess(response, 'Property home');

    const home = extractHomeData(response.body);

    expect(home).toBeDefined();

    expect(home.featured).toBeDefined();
    expect(home.latest).toBeDefined();
    expect(home.mostFavorited).toBeDefined();
    expect(home.topRated).toBeDefined();
    expect(home.popularLocalities).toBeDefined();

    expect(Array.isArray(home.featured)).toBe(true);
    expect(Array.isArray(home.latest)).toBe(true);
    expect(Array.isArray(home.mostFavorited)).toBe(true);
    expect(Array.isArray(home.topRated)).toBe(true);
    expect(Array.isArray(home.popularLocalities)).toBe(true);
  });

  // ============================================================
  // 12. Nearby properties
  // ============================================================

  it('12. Nearby properties endpoint works', async () => {
    requirePropertyId();

    const response = await request(apiUrl).get('/properties/nearby').query({
      latitude: 12.9116,
      longitude: 77.6474,
      radius: 5,
    });

    assertSuccess(response, 'Nearby properties');

    const nearby = extractNearbyData(response.body);

    const properties = extractArray(response.body);

    expect(Array.isArray(properties)).toBe(true);

    /*
     * Radius may be returned at the root, inside data,
     * or inside a nearby wrapper.
     */
    const radius =
      nearby?.radius ??
      response.body?.radius ??
      response.body?.data?.radius ??
      response.body?.data?.data?.radius;

    expect(radius).toBeDefined();

    if (properties.length > 0) {
      expect(properties[0].distance).toBeDefined();
    }
  });

  // ============================================================
  // 13. Owner updates property
  // ============================================================

  it('13. Owner can update own property', async () => {
    requireOwnerToken();
    requirePropertyId();

    const response = await request(apiUrl)
      .patch(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Property E2E Updated',
        price: 27000,
        description: 'Updated by RentItEase Property E2E test.',
      });

    assertSuccess(response, 'Property update');

    const property = extractProperty(response.body);

    expect(property.id).toBe(propertyId);
    expect(property.title).toBe('Property E2E Updated');
    expect(Number(property.price)).toBe(27000);
  });

  // ============================================================
  // 14. Tenant cannot update owner's property
  // ============================================================

  it('14. Tenant cannot update owner property', async () => {
    requireTenantToken();
    requirePropertyId();

    const response = await request(apiUrl)
      .patch(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        title: 'Unauthorized Tenant Update',
      });

    expect(response.status).toBe(403);
  });

  // ============================================================
  // 15. Update amenities
  // ============================================================

  it('15. Owner can update property amenities when a valid amenity exists', async () => {
    requireOwnerToken();
    requirePropertyId();

    /*
     * Discover an existing amenity through the API.
     *
     * If no amenity endpoint/data exists, skip the mutation
     * assertion rather than inventing an amenity ID.
     */

    const amenityResponse = await request(apiUrl).get('/amenities');

    if (amenityResponse.status === 404) {
      console.log(
        'Skipping amenity mutation assertion: GET /amenities is not exposed.',
      );
      return;
    }

    assertSuccess(amenityResponse, 'Amenity list');

    const amenities = extractArray(amenityResponse.body);

    if (amenities.length === 0) {
      console.log('Skipping amenity mutation assertion: no amenities exist.');
      return;
    }

    amenityId = amenities[0].id;

    expect(amenityId).toBeTruthy();

    const response = await request(apiUrl)
      .post(`/properties/${propertyId}/amenities`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amenityIds: [amenityId],
      });

    assertSuccess(response, 'Property amenity update');

    const property = extractProperty(response.body);

    expect(property).toBeDefined();
  });

  // ============================================================
  // 16. Tenant cannot update amenities
  // ============================================================

  it('16. Tenant cannot update owner property amenities', async () => {
    requireTenantToken();
    requirePropertyId();

    /*
     * Deliberately invalid-looking amenity ID is used only for
     * authorization testing. Ownership should be checked first.
     */

    const response = await request(apiUrl)
      .post(`/properties/${propertyId}/amenities`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        amenityIds: ['unauthorized-test-amenity'],
      });

    expect(response.status).toBe(403);
  });

  // ============================================================
  // 17. Unauthenticated update rejected
  // ============================================================

  it('17. Unauthenticated user cannot update property', async () => {
    requirePropertyId();

    const response = await request(apiUrl)
      .patch(`/properties/${propertyId}`)
      .send({
        title: 'Unauthenticated Update',
      });

    expect(response.status).toBe(401);
  });

  // ============================================================
  // 18. Unauthenticated delete rejected
  // ============================================================

  it('18. Unauthenticated user cannot delete property', async () => {
    requirePropertyId();

    const response = await request(apiUrl).delete(`/properties/${propertyId}`);

    expect(response.status).toBe(401);
  });

  // ============================================================
  // 19. Owner can delete property
  // ============================================================

  it('19. Owner can delete own property', async () => {
    requireOwnerToken();
    requirePropertyId();

    const response = await request(apiUrl)
      .delete(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assertSuccess(response, 'Property deletion');

    const message = extractMessage(response.body);

    expect(message).toBeDefined();
    expect(message).toContain('Property deleted successfully');
  });

  // ============================================================
  // 20. Deleted property is no longer available
  // ============================================================

  it('20. Deleted property returns 404', async () => {
    requirePropertyId();

    const response = await request(apiUrl).get(`/properties/${propertyId}`);

    expect(response.status).toBe(404);
  });

  // ============================================================
  // 21. Deleted property is absent from owner list
  // ============================================================

  it('21. Deleted property is excluded from owner properties', async () => {
    requireOwnerToken();
    requirePropertyId();

    const response = await request(apiUrl)
      .get('/properties/my-properties')
      .set('Authorization', `Bearer ${ownerToken}`);

    assertSuccess(response, 'Owner properties after deletion');

    const properties = extractArray(response.body);

    expect(properties.some((property) => property.id === propertyId)).toBe(
      false,
    );
  });
});
