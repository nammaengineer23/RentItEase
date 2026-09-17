'use strict';

/**
 * Safe production release-E2E cleanup.
 * Uses authenticated APIs only. It removes explicitly marked E2E properties
 * and legacy isolated visit fixtures while preserving the dedicated accounts.
 */
const baseUrl = (process.env.E2E_BASE_URL || '').replace(/\/+$/, '');
const apiPrefix = '/' + (process.env.E2E_API_PREFIX || '/api/v1').replace(/^\/+|\/+$/g, '');
const apiUrl = `${baseUrl}${apiPrefix}`;
const required = ['E2E_BASE_URL', 'E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD'];

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

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
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
  const failures = [];

  for (const property of marked) {
    if (!property?.id) continue;
    try {
      await jsonRequest(`/admin/properties/${property.id}`, { method: 'DELETE', headers });
      deleted += 1;
    } catch (error) {
      failures.push(`${property.id}: ${error.message}`);
    }
  }

  console.log('==============================================');
  console.log(' RentItEase automatic E2E cleanup');
  console.log('==============================================');
  console.log(`Admin-visible properties scanned: ${properties.length}`);
  console.log(`Explicit E2E properties matched: ${marked.length}`);
  console.log(`E2E properties deleted: ${deleted}`);
  console.log('Dedicated E2E tenant/owner/admin accounts: PRESERVED');
  console.log('Cleanup mode: authenticated API only; no broad database deletes');
  console.log('==============================================');

  if (failures.length) throw new Error(`E2E cleanup had ${failures.length} failure(s):\n${failures.join('\n')}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
