import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

type Account = {
  emailEnv: string;
  passwordEnv: string;
  email: string;
  fullName: string;
  role: UserRole;
};

const accounts: Account[] = [
  { emailEnv: 'E2E_TENANT_EMAIL', passwordEnv: 'E2E_TENANT_PASSWORD', email: 'tenent.test@rentitease.com', fullName: 'E2E Tenant', role: UserRole.USER },
  { emailEnv: 'E2E_OWNER_EMAIL', passwordEnv: 'E2E_OWNER_PASSWORD', email: 'owner.test@rentitease.com', fullName: 'E2E Owner', role: UserRole.OWNER },
  { emailEnv: 'E2E_OTHER_OWNER_EMAIL', passwordEnv: 'E2E_OTHER_OWNER_PASSWORD', email: 'testother.owner@rentitease.com', fullName: 'E2E Other Owner', role: UserRole.OWNER },
  { emailEnv: 'E2E_ADMIN_EMAIL', passwordEnv: 'E2E_ADMIN_PASSWORD', email: 'admin@rentitease.com', fullName: 'E2E Admin', role: UserRole.ADMIN },
];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const rawUrl = required('E2E_DATABASE_URL');
  const expectedHost = required('E2E_ALLOWED_DATABASE_HOST').toLowerCase();
  const confirmedBranch = required('E2E_CONFIRMED_NEON_BRANCH');
  if (confirmedBranch !== 'rentitease-e2e-fresh') {
    throw new Error('Refusing to seed: E2E_CONFIRMED_NEON_BRANCH must be exactly rentitease-e2e-fresh.');
  }

  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new Error('E2E_DATABASE_URL must be a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('E2E_DATABASE_URL must use PostgreSQL.');
  if (!parsed.hostname.toLowerCase().endsWith('.neon.tech')) throw new Error('Refusing to seed a non-Neon database host.');
  if (parsed.hostname.toLowerCase() !== expectedHost) throw new Error('Refusing to seed: database hostname does not match E2E_ALLOWED_DATABASE_HOST.');
  if (parsed.pathname.replace(/^\//, '') !== 'neondb') throw new Error('Refusing to seed: expected Neon database name neondb.');
  if (parsed.searchParams.get('options')?.includes('endpoint=') === false) {
    // Hostname allowlisting is the primary guard; some Neon connection strings omit options.
  }

  for (const account of accounts) {
    const configuredEmail = required(account.emailEnv).toLowerCase();
    if (configuredEmail !== account.email) {
      throw new Error(`Refusing to seed: ${account.emailEnv} must match the approved E2E account list.`);
    }
    if (required(account.passwordEnv).length < 6) {
      throw new Error(`Refusing to seed: ${account.passwordEnv} is too short.`);
    }
  }

  // Prisma receives only the explicitly allowlisted Neon branch endpoint.
  process.env.DATABASE_URL = rawUrl;
  const prisma = new PrismaClient();

  try {
    const db = await prisma.$queryRaw<Array<{ database_name: string; database_user: string }>>`
      SELECT current_database() AS database_name, current_user AS database_user
    `;
    if (db[0]?.database_name !== 'neondb') throw new Error('Connected database is not neondb; refusing to seed.');
    console.log('Connected to allowlisted Neon host; database name verified. Credentials are not logged.');

    for (const account of accounts) {
      const email = account.email;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        if (existing.role !== account.role) {
          throw new Error(`Existing E2E account has unexpected role: ${email}. No role was changed.`);
        }
        if (!existing.isActive || existing.deletedAt) {
          throw new Error(`Existing E2E account is inactive/deleted: ${email}. No account was changed.`);
        }
        console.log(`Verified existing account and role: ${email} (${account.role}); left unchanged.`);
        continue;
      }

      const passwordHash = await bcrypt.hash(required(account.passwordEnv), 10);
      await prisma.user.create({
        data: {
          email,
          fullName: account.fullName,
          role: account.role,
          passwordHash,
          isActive: true,
          ownerRequestStatus: account.role === UserRole.OWNER ? 'APPROVED' : 'NONE',
          ownerReviewedAt: account.role === UserRole.OWNER ? new Date() : null,
        },
      });
      console.log(`Created E2E account: ${email} (${account.role}).`);
    }

    const verified = await prisma.user.findMany({
      where: { email: { in: accounts.map((account) => account.email) } },
      select: { email: true, role: true, isActive: true, deletedAt: true },
      orderBy: { email: 'asc' },
    });
    if (verified.length !== accounts.length) throw new Error('Post-seed verification failed: expected exactly four configured E2E accounts.');
    for (const account of accounts) {
      const row = verified.find((item) => item.email === account.email);
      if (!row || row.role !== account.role || !row.isActive || row.deletedAt) {
        throw new Error(`Post-seed role/status verification failed for ${account.email}.`);
      }
    }
    console.log('PASS: all four E2E users exist with expected roles and active status.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'E2E account seed failed.');
  process.exitCode = 1;
});
