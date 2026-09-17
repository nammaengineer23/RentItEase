import dotenv from 'dotenv';
import path from 'path';

// Release E2E runs against the live Railway API. A deployment/proxy can
// occasionally return a short-lived gateway error even though the API is
// healthy before and after the request. Retry only infrastructure failures;
// application 4xx/5xx responses still fail immediately.
const supertest = require('supertest') as any;
const testPrototype = supertest.Test?.prototype as any;

if (testPrototype && !testPrototype.__rentItEaseTransientRetryInstalled) {
  const originalEnd = testPrototype.end;

  testPrototype.end = function patchedEnd(callback: any) {
    if (!this.__rentItEaseTransientRetryConfigured) {
      this.__rentItEaseTransientRetryConfigured = true;
      this.retry(3, (error: any, response: any) => {
        const status = response?.status;
        const transientGatewayError = [502, 503, 504].includes(status);
        const transientNetworkError =
          !response &&
          Boolean(error) &&
          ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN'].includes(
            error?.code,
          );
        const shouldRetry = transientGatewayError || transientNetworkError;

        if (shouldRetry) {
          console.warn(
            `[release-e2e] transient ${status ?? error?.code ?? 'network error'}; retrying request`,
          );
        }

        return shouldRetry;
      });
    }

    return originalEnd.call(this, callback);
  };

  testPrototype.__rentItEaseTransientRetryInstalled = true;
}

// Load the same E2E environment file used by the normal E2E tests.
dotenv.config({
  path: path.resolve(__dirname, '../.env.e2e'),
});

const required = [
  'E2E_BASE_URL',
  'E2E_API_PREFIX',
  'E2E_TENANT_PASSWORD',
  'E2E_OWNER_PASSWORD',
];

// Backward-compatible login handling:
// Existing file uses E2E_TENANT_EMAIL / E2E_OWNER_EMAIL.
// Release tests use E2E_TENANT_EMAIL / E2E_OWNER_EMAIL.
if (!process.env.E2E_TENANT_EMAIL && process.env.E2E_TENANT_EMAIL) {
  process.env.E2E_TENANT_EMAIL = process.env.E2E_TENANT_EMAIL;
}

if (!process.env.E2E_OWNER_EMAIL && process.env.E2E_OWNER_EMAIL) {
  process.env.E2E_OWNER_EMAIL = process.env.E2E_OWNER_EMAIL;
}

required.push('E2E_TENANT_EMAIL', 'E2E_OWNER_EMAIL');
required.push('E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD');

if ((process.env.E2E_STRICT ?? 'true') === 'true') {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      [
        `Missing release E2E variables: ${missing.join(', ')}`,
        '',
        'Expected file:',
        'backend/test/.env.e2e',
        '',
        'Existing E2E email variables are automatically mapped:',
        'E2E_TENANT_EMAIL -> E2E_TENANT_EMAIL',
        'E2E_OWNER_EMAIL  -> E2E_OWNER_EMAIL',
      ].join('\n'),
    );
  }
}

// Normalize URL.
if (process.env.E2E_BASE_URL) {
  process.env.E2E_BASE_URL =
    process.env.E2E_BASE_URL.replace(/\/+$/, '');
}

// Normalize API prefix.
if (process.env.E2E_API_PREFIX) {
  process.env.E2E_API_PREFIX =
    '/' + process.env.E2E_API_PREFIX.replace(/^\/+|\/+$/g, '');
}

console.log('');
console.log('==============================================');
console.log(' RentItEase Release E2E Environment');
console.log('==============================================');
console.log(`Base URL: ${process.env.E2E_BASE_URL}`);
console.log(`API Prefix: ${process.env.E2E_API_PREFIX}`);
console.log(`Tenant login: ${process.env.E2E_TENANT_EMAIL}`);
console.log(`Owner login: ${process.env.E2E_OWNER_EMAIL}`);
console.log('Property fixtures: created by each E2E suite');
console.log('Transient gateway retry: 3 retries for 502/503/504 and network resets');
console.log('==============================================');
console.log('');
