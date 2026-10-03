import request, { Response } from 'supertest';
import { createHmac } from 'crypto';

export const baseUrl = () => {
  const base = process.env.E2E_BASE_URL;
  if (!base) throw new Error('E2E_BASE_URL is not configured.');
  return base.replace(/\/+$/, '');
};

export const apiPrefix = () => {
  const prefix = process.env.E2E_API_PREFIX || '/api/v1';
  return '/' + prefix.replace(/^\/+|\/+$/g, '');
};

export const apiUrl = () => `${baseUrl()}${apiPrefix()}`;

export function strictRequired(...keys: string[]) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing E2E variables: ${missing.join(', ')}`);
  }
}

export function extractData(body: any): any {
  let current = body;
  for (let i = 0; i < 6; i++) {
    if (
      current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      current.data !== undefined
    ) {
      current = current.data;
    } else {
      break;
    }
  }
  return current;
}

export function extractToken(body: any): string {
  const values = [
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
  const token = values.find((v) => typeof v === 'string' && v.length > 20);
  if (!token) {
    throw new Error(`No access token in response: ${JSON.stringify(body)}`);
  }
  return token;
}

export async function login(loginValue: string, password: string) {
  const response = await request(apiUrl())
    .post('/auth/login')
    .send({ login: loginValue, password })
    .expect((res) => {
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(
          `Login failed with ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }
    });

  return {
    token: extractToken(response.body),
    body: response.body,
    data: extractData(response.body),
  };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function futureIso(minutes = 30) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function idFrom(body: any): string | undefined {
  const d = extractData(body);
  return (
    d?.id ??
    d?.booking?.id ??
    d?.payment?.id ??
    d?.membership?.id ??
    d?.premiumListing?.id ??
    d?.invoice?.id ??
    d?.conversation?.id ??
    d?.message?.id
  );
}

export function statusOk(res: Response, expected: number[] = [200, 201, 204]) {
  if (!expected.includes(res.status)) {
    throw new Error(
      `Unexpected HTTP ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }
}

/** A stable marker used by automatic cleanup to distinguish test listings. */
export function e2eMarker() {
  return `[E2E:${process.env.E2E_RUN_ID ?? process.env.GITHUB_RUN_ID ?? Date.now()}]`;
}

/**
 * Creates an isolated listing and drives it through the complete production
 * lifecycle required for public visibility: DRAFT -> SUBMITTED -> VERIFIED
 * -> PUBLISHED.
 */
export async function createApprovedE2EProperty(
  ownerToken: string,
  adminToken: string,
  label = 'Release E2E',
): Promise<string> {
  const create = await request(apiUrl())
    .post('/properties')
    .set(auth(ownerToken))
    .send({
      title: `${e2eMarker()} ${label} Property`,
      description: '[E2E] Isolated property generated for release verification.',
      price: 25000,
      address: '123 Release Test Road', locality: 'HSR Layout', city: 'Bangalore',
      state: 'Karnataka', country: 'India', pincode: '560102',
      bedrooms: 2, bathrooms: 2, area: 1200, propertyType: 'APARTMENT',
      furnishing: 'SEMI_FURNISHED', parking: true, petFriendly: true,
      securityDeposit: 50000,
    });
  statusOk(create);
  const property = extractData(create.body)?.property ?? extractData(create.body);
  const id = property?.id as string | undefined;
  if (!id) throw new Error(`Property fixture was not created: ${JSON.stringify(create.body)}`);
  if (property.isVerified !== false || property.isAvailable !== false) {
    throw new Error(`New property must remain pending before approval: ${JSON.stringify(property)}`);
  }
  const approve = await request(apiUrl()).patch(`/admin/properties/${id}/approve`).set(auth(adminToken));
  statusOk(approve);
  const approved = extractData(approve.body);
  if (approved?.isVerified !== true || approved?.isAvailable !== true) {
    throw new Error(`Approved property was not made public: ${JSON.stringify(approved)}`);
  }
  return id;
}
export function unwrapArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  const d = extractData(body);
  if (Array.isArray(d)) return d;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

/**
 * Ensure the user has no ACTIVE membership before a release E2E test
 * creates a fresh membership.
 *
 * Release E2E tests run against the persistent Railway/Neon database,
 * so previous test runs may leave an ACTIVE membership behind.
 *
 * We deliberately expire existing ACTIVE memberships through the API
 * rather than deleting database records or weakening the backend rule.
 */
export async function clearActiveMemberships(
  userId: string,
  token: string,
) {
  const res = await request(apiUrl())
    .get(`/membership/users/${userId}`)
    .set(auth(token));

  statusOk(res, [200]);

  const memberships = unwrapArray(res.body);

  const activeMemberships = memberships.filter(
    (membership: any) => membership?.status === 'ACTIVE',
  );

  for (const membership of activeMemberships) {
    if (!membership?.id) continue;

    const expire = await request(apiUrl())
      .patch(`/membership/${membership.id}/expire`)
      .set(auth(token));

    statusOk(expire, [200, 201]);

    const expired = extractData(expire.body);

    if (expired?.status !== 'EXPIRED') {
      throw new Error(
        `Failed to expire existing membership ${membership.id}: ` +
          JSON.stringify(expire.body),
      );
    }
  }

  return activeMemberships.length;
}


/**
 * Simulate a captured Razorpay provider callback without creating a real-money
 * transaction against the production gateway. The webhook is authenticated
 * with the production webhook secret and exercises the same state transition
 * used by Razorpay after a captured payment.
 */
export async function markPaymentCapturedViaWebhook(
  payment: { bookingId: string; razorpayOrderId: string; amount: number; currency: string },
) {
  const secret = process.env.E2E_RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('E2E_RAZORPAY_WEBHOOK_SECRET is required.');
  }

  const razorpayPaymentId = `pay_e2e_webhook_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const eventId = `e2e-${process.env.GITHUB_RUN_ID ?? Date.now()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const payload = {
    entity: 'event',
    account_id: 'e2e',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: razorpayPaymentId,
          entity: 'payment',
          amount: Math.round(Number(payment.amount) * 100),
          currency: payment.currency,
          status: 'captured',
          order_id: payment.razorpayOrderId,
        },
      },
    },
  };

  const rawBody = JSON.stringify(payload);
  const signature = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const response = await request(apiUrl())
    .post('/payments/webhook')
    .set('x-razorpay-event-id', eventId)
    .set('x-razorpay-signature', signature)
    .set('content-type', 'application/json')
    .send(rawBody);

  statusOk(response, [200]);
  if (response.body?.success !== true) {
    throw new Error(`Razorpay webhook simulation failed: ${JSON.stringify(response.body)}`);
  }

  return { razorpayPaymentId, eventId, response: response.body };
}
