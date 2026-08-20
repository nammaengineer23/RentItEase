import dotenv from 'dotenv';
import path from 'path';

// Load the same E2E environment file used by the normal E2E tests.
dotenv.config({
  path: path.resolve(__dirname, '../.env.e2e'),
});

const required = [
  'E2E_BASE_URL',
  'E2E_API_PREFIX',
  'E2E_TENANT_PASSWORD',
  'E2E_OWNER_PASSWORD',
  'E2E_PROPERTY_ID',
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
console.log(`Property ID: ${process.env.E2E_PROPERTY_ID}`);
console.log('==============================================');
console.log('');