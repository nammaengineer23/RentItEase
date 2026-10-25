import request from 'supertest';
import { describe, expect, it, beforeAll } from '@jest/globals';
import {
  apiUrl,
  auth,
  extractData,
  login,
  statusOk,
  unwrapArray,
  e2eMarker,
} from './helpers';

describe('Staging E2E • Property marketplace', () => {
  const ownerEmail = process.env.E2E_OWNER_EMAIL;
  const ownerPassword = process.env.E2E_OWNER_PASSWORD;
  const otherOwnerEmail = process.env.E2E_OTHER_OWNER_EMAIL;
  const otherOwnerPassword = process.env.E2E_OTHER_OWNER_PASSWORD;
  const tenantEmail = process.env.E2E_TENANT_EMAIL;
  const tenantPassword = process.env.E2E_TENANT_PASSWORD;
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  const expectMarketplaceEnabled = process.env.E2E_EXPECT_MARKETPLACE_ENABLED === 'true';
  // Mutating marketplace coverage is restricted to the isolated staging workflow.
  const marketplaceReadOnly = process.env.E2E_MARKETPLACE_READ_ONLY === 'true';

  let ownerToken = '';
  let otherOwnerToken = '';
  let tenantToken = '';
  let adminToken = '';

  const createdListings: Array<{ id: string; type: string; title: string }> = [];

  beforeAll(async () => {
    const required: Record<string, string | undefined> = {
      E2E_OWNER_EMAIL: ownerEmail,
      E2E_OWNER_PASSWORD: ownerPassword,
      E2E_OTHER_OWNER_EMAIL: otherOwnerEmail,
      E2E_OTHER_OWNER_PASSWORD: otherOwnerPassword,
      E2E_TENANT_EMAIL: tenantEmail,
      E2E_TENANT_PASSWORD: tenantPassword,
      E2E_ADMIN_EMAIL: adminEmail,
      E2E_ADMIN_PASSWORD: adminPassword,
    };
    const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length) throw new Error(`Missing staging E2E configuration: ${missing.join(', ')}`);

    // Authenticate serially to avoid bursting the production login rate limiter.
    ownerToken = (await login(ownerEmail!, ownerPassword!)).token;
    otherOwnerToken = (await login(otherOwnerEmail!, otherOwnerPassword!)).token;
    tenantToken = (await login(tenantEmail!, tenantPassword!)).token;
    adminToken = (await login(adminEmail!, adminPassword!)).token;
  });

  async function createAndApprove(type: 'SALE' | 'LEASE' | 'SITE_SALE'): Promise<string | null> {
    const title = `${e2eMarker()} Marketplace ${type} ${Date.now()}`;
    const payload: Record<string, unknown> = {
      title,
      description: `Isolated staging E2E listing for ${type}.`,
      price: 25000,
      address: '123 Staging Test Road',
      locality: 'HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560102',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      propertyType: 'APARTMENT',
      furnishing: 'SEMI_FURNISHED',
      parking: true,
      petFriendly: true,
      securityDeposit: 50000,
      transactionType: type,
    };

    if (type === 'SALE') payload.askingPrice = 8500000;
    if (type === 'LEASE') {
      payload.leaseTermMonths = 36;
      payload.leaseRenewalTerms = 'Renewal by mutual written agreement';
    }
    if (type === 'SITE_SALE') {
      payload.askingPrice = 4200000;
      payload.landArea = 1200;
      payload.landAreaUnit = 'sq_ft';
      payload.siteFrontage = 30;
      payload.siteFacing = 'NORTH';
      payload.roadAccess = true;
    }

    const created = await request(apiUrl()).post('/properties').set(auth(ownerToken)).send(payload);
    if (!expectMarketplaceEnabled) {
      expect(created.status).toBe(400);
      expect(JSON.stringify(created.body)).toContain('Sales and long-term lease listings are not enabled yet.');
      return null;
    }
    statusOk(created);
    const property = extractData(created.body)?.property ?? extractData(created.body);
    expect(property?.id).toBeTruthy();
    expect(property?.transactionType).toBe(type);
    expect(property?.isVerified).toBe(false);
    expect(property?.isAvailable).toBe(false);

    const approval = await request(apiUrl()).patch(`/admin/properties/${property.id}/approve`).set(auth(adminToken));
    statusOk(approval);
    createdListings.push({ id: property.id, type, title });
    return property.id as string;
  }

  it.each(['SALE', 'LEASE', 'SITE_SALE'] as const)('browses %s listings', async (type) => {
    if (marketplaceReadOnly) {
      const browse = await request(apiUrl()).get('/properties').query({ transactionType: type });
      statusOk(browse);
      const results = unwrapArray(browse.body);
      expect(Array.isArray(results)).toBe(true);
      return;
    }
    const id = await createAndApprove(type);
    const browse = await request(apiUrl()).get('/properties').query({ transactionType: type, search: e2eMarker() });
    statusOk(browse);
    const results = unwrapArray(browse.body);
    if (!expectMarketplaceEnabled) {
      expect(results.every((item: any) => item.transactionType === 'RENT')).toBe(true);
      expect(results.some((item: any) => item.transactionType === type)).toBe(false);
      expect(id).toBeNull();
      return;
    }
    expect(results.some((item: any) => item.id === id && item.transactionType === type)).toBe(true);

    const detail = await request(apiUrl()).get(`/properties/${id}`);
    statusOk(detail);
    expect((extractData(detail.body)?.property ?? extractData(detail.body))?.transactionType).toBe(type);
  });

  it(marketplaceReadOnly
    ? 'keeps production marketplace enquiry coverage read-only'
    : expectMarketplaceEnabled
      ? 'routes enquiries to the sender and listing owner, and permits owner status updates'
      : 'keeps marketplace enquiry flow inactive while the feature flag is off', async () => {
    if (marketplaceReadOnly) return;
    if (!expectMarketplaceEnabled) {
      expect(createdListings).toHaveLength(0);
      return;
    }
    const listing = createdListings.find((item) => item.type === 'SALE');
    expect(listing).toBeTruthy();

    const created = await request(apiUrl()).post('/property-enquiries').set(auth(tenantToken)).send({
      propertyId: listing!.id,
      message: 'I am interested in this listing. Can we arrange a viewing?',
    });
    statusOk(created);
    const enquiry = extractData(created.body)?.enquiry ?? extractData(created.body);
    expect(enquiry?.id).toBeTruthy();
    expect(enquiry?.status).toBe('OPEN');

    const mine = await request(apiUrl()).get('/property-enquiries/mine').set(auth(tenantToken));
    statusOk(mine);
    expect(JSON.stringify(mine.body)).toContain(enquiry.id);

    const inbox = await request(apiUrl()).get('/property-enquiries/owner').set(auth(ownerToken));
    statusOk(inbox);
    expect(JSON.stringify(inbox.body)).toContain(enquiry.id);

    const update = await request(apiUrl()).patch(`/property-enquiries/${enquiry.id}/status`)
      .set(auth(ownerToken)).send({ status: 'CONTACTED', note: 'Staging E2E contact' });
    statusOk(update);
    expect((extractData(update.body)?.enquiry ?? extractData(update.body))?.status).toBe('CONTACTED');

    const forbidden = await request(apiUrl()).patch(`/property-enquiries/${enquiry.id}/status`)
      .set(auth(otherOwnerToken)).send({ status: 'CLOSED', note: 'Must be rejected' });
    expect([401, 403, 404]).toContain(forbidden.status);

    const unchanged = await request(apiUrl()).get('/property-enquiries/owner').set(auth(ownerToken));
    statusOk(unchanged);
    const persisted = JSON.stringify(unchanged.body);
    expect(persisted).toContain(enquiry.id);
    expect(persisted).toContain('CONTACTED');
  });

  it('does not allow rental listings to receive marketplace enquiries', async () => {
    const rental = await request(apiUrl()).post('/properties').set(auth(ownerToken)).send({
      title: `${e2eMarker()} Marketplace RENT guard ${Date.now()}`,
      description: 'Rental listing used to verify marketplace enquiry separation.',
      price: 25000,
      address: '123 Staging Test Road',
      locality: 'HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560102',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      propertyType: 'APARTMENT',
      furnishing: 'SEMI_FURNISHED',
      parking: true,
      petFriendly: true,
      securityDeposit: 50000,
    });
    statusOk(rental);
    const property = extractData(rental.body)?.property ?? extractData(rental.body);
    const enquiry = await request(apiUrl()).post('/property-enquiries').set(auth(tenantToken)).send({
      propertyId: property.id,
      message: 'Can I arrange a viewing for this rental?',
    });
    expect([400, 404]).toContain(enquiry.status);
  });
});
