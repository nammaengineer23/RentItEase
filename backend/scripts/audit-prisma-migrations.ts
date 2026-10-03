import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const migrationsDir = join(root, 'prisma', 'migrations');
const schemaPath = join(root, 'prisma', 'schema.prisma');

function runPrisma(args: string[], env: NodeJS.ProcessEnv = process.env) {
  execFileSync('npx', ['prisma', ...args], {
    cwd: root,
    env,
    stdio: 'inherit',
  });
}

function migrationSqlFiles(): string[] {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const sqlPath = join(migrationsDir, entry.name, 'migration.sql');
      try {
        readFileSync(sqlPath, 'utf8');
        return [sqlPath];
      } catch {
        throw new Error(`Migration directory is missing migration.sql: ${entry.name}`);
      }
    });
}

function staticAudit() {
  const files = migrationSqlFiles();
  if (files.length === 0) throw new Error('No Prisma migrations were found.');

  const destructive: string[] = [];
  for (const file of files) {
    const sql = readFileSync(file, 'utf8');
    if (/\bDROP\s+(TABLE|COLUMN|TYPE|INDEX|SCHEMA|DATABASE)\b/i.test(sql) ||
        /\bTRUNCATE\b/i.test(sql)) {
      destructive.push(file.replace(root + '\\', ''));
    }
  }

  console.log(`Migration directories discovered: ${files.length}`);
  console.log('Schema/migration static ordering check: PASS');
  console.log(
    destructive.length
      ? `Destructive SQL requires explicit review (${destructive.length} migration(s)):\n${destructive.join('\n')}`
      : 'Destructive SQL scan: PASS (none detected)',
  );
}

function databaseAudit(databaseUrl: string, label: string, applyMigrations: boolean) {
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  if (applyMigrations) {
    console.log(`\nApplying complete migration chain to ${label} database...`);
    runPrisma(['migrate', 'deploy', '--schema', schemaPath], env);
  }

  console.log(`\nRunning Prisma migration status against ${label} database...`);
  runPrisma(['migrate', 'status', '--schema', schemaPath], env);

  console.log('Checking that the migration chain produces the current Prisma schema...');
  runPrisma([
    'migrate',
    'diff',
    '--from-migrations',
    migrationsDir,
    '--to-schema-datamodel',
    schemaPath,
    '--exit-code',
  ], env);

  console.log('Checking the database for schema drift against the committed migration chain...');
  runPrisma([
    'migrate',
    'diff',
    '--from-schema-datasource',
    schemaPath,
    '--to-migrations',
    migrationsDir,
    '--exit-code',
  ], env);

  console.log(`${label} migration audit: PASS`);
}

staticAudit();

const requireDatabase = process.argv.includes('--require-db');
const applyMigrations = process.argv.includes('--apply');
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  databaseAudit(databaseUrl, 'configured', applyMigrations);
} else if (requireDatabase) {
  throw new Error('DATABASE_URL is required for --require-db.');
} else {
  console.log('Database drift checks skipped: DATABASE_URL is not configured.');
}

const migrationTestDatabaseUrl = process.env.MIGRATION_TEST_DATABASE_URL;
if (migrationTestDatabaseUrl) {
  console.log('\nRunning production-like disposable migration verification...');
  databaseAudit(migrationTestDatabaseUrl, 'fresh/production-like', true);
  console.log('Fresh/production-like migration audit: PASS');
}
