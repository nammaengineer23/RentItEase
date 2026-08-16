import request, { Response } from 'supertest';

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

export function unwrapArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  const d = extractData(body);
  if (Array.isArray(d)) return d;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}
