import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const includeLegacy = process.argv.includes('--include-legacy');
const confirmed = process.env.E2E_CLEANUP_CONFIRM === 'DELETE_RC1_DATA';

async function main() {
  const propertyWhere = includeLegacy
    ? {
        OR: [
          { title: { startsWith: '[E2E:' } },
          { title: { startsWith: 'Release ' } },
          { title: { startsWith: 'Property E2E' } },
          { description: { contains: 'E2E' } },
          { address: { contains: 'E2E' } },
        ],
      }
    : { title: { startsWith: '[E2E:' } };

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    select: { id: true, title: true },
  });
  const propertyIds = properties.map((property) => property.id);
  const bookings = await prisma.booking.findMany({
    where: { propertyId: { in: propertyIds } },
    select: { id: true, visitId: true },
  });
  const bookingIds = bookings.map((booking) => booking.id);
  const visitIds = bookings.map((booking) => booking.visitId);
  const payments = await prisma.payment.findMany({
    where: { bookingId: { in: bookingIds } },
    select: { id: true },
  });
  const paymentIds = payments.map((payment) => payment.id);
  const leases = await prisma.lease.findMany({
    where: { bookingId: { in: bookingIds } },
    select: { id: true },
  });
  const leaseIds = leases.map((lease) => lease.id);
  const plans = await prisma.membershipPlan.findMany({
    where: includeLegacy
      ? { OR: [{ name: { startsWith: 'RentItEase E2E' } }, { name: { startsWith: 'RentItEase Release' } }] }
      : { name: { startsWith: 'RentItEase E2E' } },
    select: { id: true, name: true },
  });
  const planIds = plans.map((plan) => plan.id);
  const memberships = await prisma.membership.findMany({
    where: { planId: { in: planIds } },
    select: { id: true },
  });
  const membershipIds = memberships.map((membership) => membership.id);
  const relatedIds = [
    ...propertyIds,
    ...bookingIds,
    ...visitIds,
    ...paymentIds,
    ...leaseIds,
    ...membershipIds,
  ];

  console.table(properties);
  console.log({
    mode: apply ? 'APPLY' : 'DRY RUN',
    includeLegacy,
    properties: propertyIds.length,
    bookings: bookingIds.length,
    visits: visitIds.length,
    payments: paymentIds.length,
    leases: leaseIds.length,
    memberships: membershipIds.length,
    testPlans: planIds.length,
  });

  if (!apply) {
    console.log('No records deleted. Re-run with --apply and E2E_CLEANUP_CONFIRM=DELETE_RC1_DATA after reviewing this list.');
    return;
  }
  if (!confirmed) {
    throw new Error('Refusing cleanup: set E2E_CLEANUP_CONFIRM=DELETE_RC1_DATA.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { relatedId: { in: relatedIds } } });
    await tx.invoice.deleteMany({
      where: { OR: [{ paymentId: { in: paymentIds } }, { membershipId: { in: membershipIds } }] },
    });
    await tx.premiumListing.deleteMany({ where: { membershipId: { in: membershipIds } } });
    await tx.membership.deleteMany({ where: { id: { in: membershipIds } } });
    await tx.membershipPlan.deleteMany({ where: { id: { in: planIds } } });
    await tx.property.deleteMany({ where: { id: { in: propertyIds } } });
  });
  console.log('E2E cleanup completed. No users, non-E2E plans, migrations, or database infrastructure were modified.');
}

main().finally(() => prisma.$disconnect());
