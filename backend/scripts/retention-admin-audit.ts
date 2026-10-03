import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const retentionDays = Math.max(
    Number(process.env.ADMIN_AUDIT_RETENTION_DAYS || 365),
    30,
  );
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await prisma.adminAuditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(
    JSON.stringify({
      retentionDays,
      cutoff: cutoff.toISOString(),
      deleted: result.count,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
