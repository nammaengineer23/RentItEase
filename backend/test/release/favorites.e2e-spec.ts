import request, { Response } from 'supertest';
import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect,
} from '@jest/globals';

import { apiUrl, extractData, statusOk } from './helpers';

describe('RentItEase Release E2E • Favorites', () => {
  let tenantToken = '';
  let ownerToken = '';
  let propertyId = '';
  let favoriteAdded = false;

  // ============================================================
  // TEST USERS
  // ============================================================

  const tenantEmail =
    process.env.E2E_TENANT_EMAIL || 'tenant.test@rentitease.com';

  const tenantPassword =
    process.env.E2E_TENANT_PASSWORD || 'Test@123456';

  const ownerEmail =
    process.env.E2E_OWNER_EMAIL || 'owner.test@rentitease.com';

  const ownerPassword =
    process.env.E2E_OWNER_PASSWORD || 'Test@123456';

  // ============================================================
  // AUTH HEADER
  // ============================================================

  function bearer(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // ============================================================
  // EXTRACT ACCESS TOKEN
  // Supports multiple possible API response wrappers.
  // ============================================================

  function extractAccessToken(body: any): string {
    const data = extractData(body);

    return (
      data?.accessToken ||
      data?.token ||
      body?.accessToken ||
      body?.token ||
      body?.data?.accessToken ||
      body?.data?.token ||
      ''
    );
  }

  // ============================================================
  // EXTRACT FAVORITE BOOLEAN
  // ============================================================

  function extractFavoriteStatus(body: any): boolean {
    const data = extractData(body);

    if (typeof data === 'boolean') {
      return data;
    }

    if (typeof data?.isFavorite === 'boolean') {
      return data.isFavorite;
    }

    if (typeof data?.favorite === 'boolean') {
      return data.favorite;
    }

    if (typeof data?.favorited === 'boolean') {
      return data.favorited;
    }

    if (typeof body?.isFavorite === 'boolean') {
      return body.isFavorite;
    }

    if (typeof body?.favorite === 'boolean') {
      return body.favorite;
    }

    if (typeof body?.favorited === 'boolean') {
      return body.favorited;
    }

    throw new Error(
      `Unable to determine favorite status from response: ${JSON.stringify(
        body,
      )}`,
    );
  }

  // ============================================================
  // EXTRACT FAVORITE LIST
  // ============================================================

  function extractFavorites(body: any): any[] {
    const data = extractData(body);

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.favorites)) {
      return data.favorites;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    if (Array.isArray(body?.favorites)) {
      return body.favorites;
    }

    if (Array.isArray(body?.items)) {
      return body.items;
    }

    return [];
  }

  // ============================================================
  // PROPERTY ID EXTRACTION
  // ============================================================

  function extractPropertyId(favorite: any): string {
    return (
      favorite?.propertyId ||
      favorite?.property?.id ||
      favorite?.property?.propertyId ||
      favorite?.id ||
      ''
    );
  }

  // ============================================================
  // FIND USABLE PROPERTY
  // ============================================================

  async function findUsableProperty(): Promise<string> {
    const response = await request(apiUrl()).get('/properties');

    if (response.status !== 200) {
      throw new Error(
        `Unable to retrieve properties: ${response.status} ${JSON.stringify(
          response.body,
        )}`,
      );
    }

    const data = extractData(response.body);

    const properties = Array.isArray(data)
      ? data
      : Array.isArray(data?.properties)
        ? data.properties
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(response.body?.properties)
            ? response.body.properties
            : Array.isArray(response.body?.items)
              ? response.body.items
              : [];

    const property = properties.find(
      (item: any) =>
        item?.id &&
        item?.isAvailable !== false &&
        item?.status !== 'INACTIVE' &&
        item?.status !== 'DELETED',
    );

    if (!property?.id) {
      throw new Error(
        `No usable property found for Favorites E2E test. Response: ${JSON.stringify(
          response.body,
        )}`,
      );
    }

    return String(property.id);
  }

  // ============================================================
  // LOGIN HELPER
  //
  // IMPORTANT:
  // The current backend Auth DTO expects "login", NOT "email".
  // ============================================================

  async function login(
    email: string,
    password: string,
    roleName: string,
  ): Promise<string> {
    const response = await request(apiUrl())
      .post('/auth/login')
      .send({
        login: email,
        password,
      });

    statusOk(response);

    const token = extractAccessToken(response.body);

    if (!token) {
      throw new Error(
        `${roleName} login succeeded but no access token was returned. ` +
          `Response: ${JSON.stringify(response.body)}`,
      );
    }

    return token;
  }

  // ============================================================
  // BEFORE ALL
  // ============================================================

  beforeAll(async () => {
    console.log('');
    console.log('==============================================');
    console.log(' RentItEase Favorites E2E Test');
    console.log('==============================================');
    console.log(
      `Base URL: ${process.env.E2E_BASE_URL || 'configured API'}`,
    );
    console.log(`API: ${apiUrl()}`);
    console.log(`Tenant: ${tenantEmail}`);
    console.log(`Owner: ${ownerEmail}`);
    console.log('==============================================');
    console.log('');
  });

  // ============================================================
  // 1. TENANT LOGIN
  // ============================================================

  it('1. Tenant can login', async () => {
    tenantToken = await login(
      tenantEmail,
      tenantPassword,
      'Tenant',
    );

    expect(tenantToken).toBeTruthy();

    console.log('✓ Tenant login successful');
    console.log(`  Tenant: ${tenantEmail}`);
  });

  // ============================================================
  // 2. OWNER LOGIN
  // ============================================================

  it('2. Owner can login', async () => {
    ownerToken = await login(
      ownerEmail,
      ownerPassword,
      'Owner',
    );

    expect(ownerToken).toBeTruthy();

    console.log('✓ Owner login successful');
    console.log(`  Owner: ${ownerEmail}`);
  });

  // ============================================================
  // 3. FIND USABLE PROPERTY
  // ============================================================

  it('3. Find a usable property', async () => {
    expect(tenantToken).toBeTruthy();

    propertyId = await findUsableProperty();

    expect(propertyId).toBeTruthy();

    console.log('✓ Usable property found');
    console.log(`  Property ID: ${propertyId}`);
  });

  // ============================================================
  // 4. UNAUTHENTICATED ADD FAVORITE
  // ============================================================

  it('4. Unauthenticated user cannot add favorite', async () => {
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl()).post(
      `/favorites/${propertyId}`,
    );

    expect([401, 403]).toContain(response.status);

    console.log(
      `✓ Unauthenticated favorite creation rejected (${response.status})`,
    );
  });

  // ============================================================
  // 5. TENANT ADD FAVORITE
  // ============================================================

  it('5. Tenant can add property to favorites', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl())
      .post(`/favorites/${propertyId}`)
      .set(bearer(tenantToken));

    if ([200, 201].includes(response.status)) {
      favoriteAdded = true;

      console.log('✓ Tenant added property to favorites');
      return;
    }

    /*
     * Previous test runs may have left this favorite in the database.
     * Treat an already-existing favorite as a valid state.
     */
    if (response.status === 400) {
      const message = JSON.stringify(response.body).toLowerCase();

      if (
        message.includes('already') ||
        message.includes('favorite') ||
        message.includes('exists')
      ) {
        favoriteAdded = true;

        console.log(
          '✓ Property was already favorited; existing favorite reused',
        );

        return;
      }
    }

    throw new Error(
      `Unexpected favorite creation response: ${response.status} ${JSON.stringify(
        response.body,
      )}`,
    );
  });

  // ============================================================
  // 6. FAVORITE STATUS = TRUE
  // ============================================================

  it('6. Tenant can check favorite status', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl())
      .get(`/favorites/check/${propertyId}`)
      .set(bearer(tenantToken));

    statusOk(response);

    const isFavorite = extractFavoriteStatus(response.body);

    expect(isFavorite).toBe(true);

    console.log('✓ Favorite status is true');
  });

  // ============================================================
  // 7. FAVORITE LIST CONTAINS PROPERTY
  // ============================================================

  it('7. Tenant favorite list contains the property', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl())
      .get('/favorites')
      .set(bearer(tenantToken));

    statusOk(response);

    const favorites = extractFavorites(response.body);

    expect(Array.isArray(favorites)).toBe(true);

    const found = favorites.some(
      (favorite: any) =>
        extractPropertyId(favorite) === propertyId,
    );

    expect(found).toBe(true);

    console.log('✓ Property exists in tenant favorite list');
  });

  // ============================================================
  // 8. PROPERTY DETAILS WHILE FAVORITED
  // ============================================================

  it('8. Tenant can retrieve property details while favorited', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl())
      .get(`/properties/${propertyId}`)
      .set(bearer(tenantToken));

    statusOk(response);

    const data = extractData(response.body);

    const returnedPropertyId =
      data?.id ||
      data?.property?.id ||
      response.body?.id ||
      response.body?.property?.id;

    expect(String(returnedPropertyId)).toBe(propertyId);

    console.log('✓ Favorited property remains accessible');
  });

  // ============================================================
  // 9. OWNER FAVORITE STATE IS ISOLATED
  // ============================================================

  it('9. Owner cannot use tenant favorite state as their own', async () => {
    expect(ownerToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl())
      .get(`/favorites/check/${propertyId}`)
      .set(bearer(ownerToken));

    statusOk(response);

    const isFavorite = extractFavoriteStatus(response.body);

    expect(isFavorite).toBe(false);

    console.log('✓ Favorite state is isolated per user');
  });

  // ============================================================
  // 10. OWNER FAVORITE LIST IS INDEPENDENT
  // ============================================================

  it('10. Owner can access their own favorite list independently', async () => {
    expect(ownerToken).toBeTruthy();

    const response = await request(apiUrl())
      .get('/favorites')
      .set(bearer(ownerToken));

    statusOk(response);

    const favorites = extractFavorites(response.body);

    expect(Array.isArray(favorites)).toBe(true);

    const tenantPropertyPresent = favorites.some(
      (favorite: any) =>
        extractPropertyId(favorite) === propertyId,
    );

    expect(tenantPropertyPresent).toBe(false);

    console.log(
      '✓ Owner favorite list is independent from tenant',
    );
  });

  // ============================================================
  // 11. TENANT REMOVE FAVORITE
  // ============================================================

  it('11. Tenant can remove property from favorites', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();
    expect(favoriteAdded).toBe(true);

    const response = await request(apiUrl())
      .delete(`/favorites/${propertyId}`)
      .set(bearer(tenantToken));

    statusOk(response);

    favoriteAdded = false;

    console.log('✓ Tenant removed property from favorites');
  });

  // ============================================================
  // 12. FAVORITE STATUS = FALSE
  // ============================================================

  it('12. Favorite status is false after removal', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl())
      .get(`/favorites/check/${propertyId}`)
      .set(bearer(tenantToken));

    statusOk(response);

    const isFavorite = extractFavoriteStatus(response.body);

    expect(isFavorite).toBe(false);

    console.log('✓ Favorite status is false after removal');
  });

  // ============================================================
  // 13. PROPERTY ABSENT FROM FAVORITE LIST
  // ============================================================

  it('13. Removed property is absent from favorite list', async () => {
    expect(tenantToken).toBeTruthy();
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl())
      .get('/favorites')
      .set(bearer(tenantToken));

    statusOk(response);

    const favorites = extractFavorites(response.body);

    const found = favorites.some(
      (favorite: any) =>
        extractPropertyId(favorite) === propertyId,
    );

    expect(found).toBe(false);

    console.log(
      '✓ Removed property is absent from favorite list',
    );
  });

  // ============================================================
  // 14. UNAUTHENTICATED FAVORITE LIST
  // ============================================================

  it('14. Unauthenticated user cannot retrieve favorites', async () => {
    const response = await request(apiUrl()).get('/favorites');

    expect([401, 403]).toContain(response.status);

    console.log(
      `✓ Unauthenticated favorite list access rejected (${response.status})`,
    );
  });

  // ============================================================
  // 15. UNAUTHENTICATED FAVORITE CHECK
  // ============================================================

  it('15. Unauthenticated user cannot check favorite status', async () => {
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl()).get(
      `/favorites/check/${propertyId}`,
    );

    expect([401, 403]).toContain(response.status);

    console.log(
      `✓ Unauthenticated favorite check rejected (${response.status})`,
    );
  });

  // ============================================================
  // 16. UNAUTHENTICATED FAVORITE DELETE
  // ============================================================

  it('16. Unauthenticated user cannot remove a favorite', async () => {
    expect(propertyId).toBeTruthy();

    const response = await request(apiUrl()).delete(
      `/favorites/${propertyId}`,
    );

    expect([401, 403]).toContain(response.status);

    console.log(
      `✓ Unauthenticated favorite removal rejected (${response.status})`,
    );
  });

  // ============================================================
  // AFTER ALL
  // ============================================================

  afterAll(() => {
    console.log('');
    console.log('==============================================');
    console.log(
      ' RentItEase Favorites E2E workflow completed',
    );
    console.log('==============================================');
    console.log(
      `Tenant authenticated: ${Boolean(tenantToken)}`,
    );
    console.log(
      `Owner authenticated: ${Boolean(ownerToken)}`,
    );
    console.log(
      `Property tested: ${Boolean(propertyId)}`,
    );
    console.log(
      `Favorite cleaned up: ${!favoriteAdded}`,
    );
    console.log('==============================================');
    console.log('');
  });
});
