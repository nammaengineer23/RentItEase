'use strict';

/**
 * Safe production release-E2E cleanup.
 * Uses authenticated APIs only. It removes explicitly marked E2E properties
 * and legacy isolated visit fixtures while preserving dedicated accounts.
 *
 * Cleanup is intentionally tolerant of protected production fixtures:
 * active bookings/leases must not be deleted and are reported as skipped.
 * Transient 429 responses are retried with exponential backoff.
 */
const baseUrl = (process.env.E2E_BASE_URL || '').replace(/\/+$/, '');
const apiPrefix = '/' + (process.env.E2E_API_PREFIX || '/api/v1').replace(/^\/+|\/+$/g, '');
const apiUrl = `${baseUrl}${apiPrefix}`;
const required = ['E2E_BASE_URL', 'E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD'];
const MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 1000;

function unwrap(body) {
  let current = body;
  for (let i = 0; i < 6; i += 1) {
    if (current && typeof current === 'object' && !Array.isArray(current) && current.data !== undefined) current = current.data;
    else break;
  }
  return current;
}

function tokenFrom(body) {
  return body?.accessToken || body?.data?.accessToken || body?.data?.data?.accessToken || body?.token || body?.data?.token;
}

function isRateLimitedError(error) {
  return error?.status === 429;
}

function isProtectedPropertyError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('active booking') || message.includes('active lease') ||
    message.includes('cannot be deleted while it has an active booking or lease');
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function jsonRequest(path, options = {}, attempt = 0) {
  const response = await fetch(`${apiUrl}${path}`, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!response.ok) {
    const error = new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
    error.status = response.status;
    error.body = body;

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30_000)
        : INITIAL_BACKOFF_MS * (2 ** attempt);
      await sleep(delay);
      return jsonRequest(path, options, attempt + 1);
    }

    throw error;
  }

  return body;
}

function asArray(body) {
  if (Array.isArray(body)) return body;
  const data = unwrap(body);
  if (Array.isArray(data)) return data;
  if (Array.isArray(body?.properties)) return body.properties;
  if (Array.isArray(body?.data?.properties)) return body.data.properties;
  if (Array.isArray(data?.properties)) return data.properties;
  return [];
}

function isE2EProperty(property) {
  const title = String(property?.title || '');
  const description = String(property?.description || '');
  return title.startsWith('[E2E:') || title.startsWith('[E2E]') ||
    title.startsWith('Property Visit CI Fixture') || description.startsWith('[E2E]') ||
    description.includes('isolated property visit release test');
}

async function main() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing cleanup variables: ${missing.join(', ')}`);

  const loginBody = await jsonRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD }),
  });
  const token = tokenFrom(loginBody);
  if (!token) throw new Error('Unable to extract admin access token for E2E cleanup.');

  const headers = { Authorization: `Bearer ${token}` };
  const properties = asArray(await jsonRequest('/admin/properties', { headers }));
  const marked = properties.filter(isE2EProperty);
  let deleted = 0;
  let skippedProtected = 0;
  const failures = [];

  for (const property of marked) {
    if (!property?.id) continue;

    try {
      await jsonRequest(`/admin/properties/${property.id}`, { method: 'DELETE', headers });
      deleted += 1;
    } catch (error) {
      if (isProtectedPropertyError(error)) {
        skippedProtected += 1;
        console.warn(`Skipping protected E2E property ${property.id}: ${error.message}`);
      } else if (isRateLimitedError(error)) {
        failures.push(`${property.id}: rate limit persisted after ${MAX_RETRIES} retries: ${error.message}`);
      } else {
        failures.push(`${property.id}: ${error.message}`);
      }
    }
  }

  console.log('==============================================');
  console.log(' RentItEase automatic E2E cleanup');
  console.log('==============================================');
  console.log(`Admin-visible properties scanned: ${properties.length}`);
  console.log(`Explicit E2E properties matched: ${marked.length}`);
  console.log(`E2E properties deleted: ${deleted}`);
  console.log(`E2E properties skipped (active booking/lease): ${skippedProtected}`);
  console.log(`E2E cleanup failures: ${failures.length}`);
  console.log('Dedicated E2E tenant/owner/admin accounts: PRESERVED');
  console.log('Cleanup mode: authenticated API only; no broad database deletes');
  console.log('==============================================');

  if (failures.length) {
    throw new Error(`E2E cleanup had ${failures.length} failure(s):\n${failures.join('\n')}`);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
