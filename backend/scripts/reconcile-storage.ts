import 'dotenv/config';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: required('FIREBASE_PROJECT_ID'),
        clientEmail: required('FIREBASE_CLIENT_EMAIL'),
        privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
      storageBucket: required('FIREBASE_STORAGE_BUCKET'),
    });
  }

  const [images, properties, messages] = await Promise.all([
    prisma.propertyImage.findMany({
      where: { publicId: { not: null } },
      select: { publicId: true },
    }),
    prisma.property.findMany({
      where: { videoPublicId: { not: null } },
      select: { videoPublicId: true },
    }),
    prisma.message.findMany({
      where: { attachmentPublicId: { not: null } },
      select: { attachmentPublicId: true },
    }),
  ]);

  const referenced = new Set<string>();
  for (const row of images) if (row.publicId) referenced.add(row.publicId);
  for (const row of properties) if (row.videoPublicId) referenced.add(row.videoPublicId);
  for (const row of messages) if (row.attachmentPublicId) referenced.add(row.attachmentPublicId);

  const bucket = getStorage().bucket();
  const prefixes = ['properties/', 'property-videos/', 'chat/'];
  const cutoff = Date.now() - ORPHAN_AGE_MS;
  let scanned = 0;
  let deleted = 0;
  let retained = 0;

  for (const prefix of prefixes) {
    const [files] = await bucket.getFiles({ prefix });
    for (const file of files) {
      scanned += 1;
      if (referenced.has(file.name)) {
        retained += 1;
        continue;
      }

      const createdAt = file.metadata?.timeCreated
        ? Date.parse(file.metadata.timeCreated)
        : Number.NaN;

      // Only delete stale unreferenced objects. Recent files may be in-flight
      // uploads or waiting for a message/property DB write to complete.
      if (Number.isFinite(createdAt) && createdAt < cutoff) {
        await file.delete({ ignoreNotFound: true });
        deleted += 1;
      } else {
        retained += 1;
      }
    }
  }

  console.log(JSON.stringify({
    scanned,
    referenced: referenced.size,
    deleted,
    retained,
    orphanAgeHours: 24,
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
