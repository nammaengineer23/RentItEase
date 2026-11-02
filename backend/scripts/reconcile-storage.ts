import 'dotenv/config';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;
const SOCIAL_VIDEO_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function objectPathFromUrl(raw: string | null | undefined, bucketName: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname.toLowerCase() === 'storage.googleapis.com') {
      const prefix = `/${bucketName}/`;
      if (url.pathname.startsWith(prefix)) return decodeURIComponent(url.pathname.slice(prefix.length));
    }
    if (
      url.hostname.toLowerCase() === 'firebasestorage.googleapis.com' &&
      url.pathname.startsWith(`/v0/b/${bucketName}/o/`)
    ) {
      return decodeURIComponent(url.pathname.slice(`/v0/b/${bucketName}/o/`.length));
    }
  } catch {
    return null;
  }
  return null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && process.env.STORAGE_RECONCILE_ALLOW_DELETE !== 'true') {
    throw new Error('Deletion is disabled. Set STORAGE_RECONCILE_ALLOW_DELETE=true and pass --apply after reviewing a dry run.');
  }
  const runtimeEnvironment = process.env.APP_ENV?.trim() || process.env.NODE_ENV?.trim();
    if (apply && runtimeEnvironment === 'production' && process.env.STORAGE_RECONCILE_ALLOW_PRODUCTION !== 'true') {
    throw new Error('Production deletion requires STORAGE_RECONCILE_ALLOW_PRODUCTION=true in addition to the explicit apply gate.');
  }

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

  const [images, properties, messages, consents, posts] = await Promise.all([
    prisma.propertyImage.findMany({ where: { publicId: { not: null } }, select: { publicId: true } }),
    prisma.property.findMany({ where: { videoPublicId: { not: null } }, select: { videoPublicId: true } }),
    prisma.message.findMany({ where: { attachmentPublicId: { not: null } }, select: { attachmentPublicId: true } }),
    prisma.socialMarketingConsent.findMany({ select: { preparedVideoUrl: true } }),
    prisma.socialMediaPost.findMany({ select: { videoUrl: true } }),
  ]);

  const referenced = new Set<string>();
  for (const row of images) if (row.publicId) referenced.add(row.publicId);
  for (const row of properties) if (row.videoPublicId) referenced.add(row.videoPublicId);
  for (const row of messages) if (row.attachmentPublicId) referenced.add(row.attachmentPublicId);

  const bucket = getStorage().bucket();
  for (const url of [
    ...consents.map((row) => row.preparedVideoUrl),
    ...posts.map((row) => row.videoUrl),
  ]) {
    const objectPath = objectPathFromUrl(url, bucket.name);
    if (objectPath) referenced.add(objectPath);
  }

  const prefixes = [
    { prefix: 'properties/', minAgeMs: DEFAULT_ORPHAN_AGE_MS },
    { prefix: 'property-videos/', minAgeMs: DEFAULT_ORPHAN_AGE_MS },
    { prefix: 'chat/', minAgeMs: DEFAULT_ORPHAN_AGE_MS },
    { prefix: 'social-videos/', minAgeMs: SOCIAL_VIDEO_RETENTION_MS },
  ];
  const now = Date.now();
  const candidates: Array<{ name: string; ageHours: number; prefix: string }> = [];
  let scanned = 0;
  let retained = 0;

  for (const { prefix, minAgeMs } of prefixes) {
    const [files] = await bucket.getFiles({ prefix });
    for (const file of files) {
      scanned += 1;
      if (referenced.has(file.name)) {
        retained += 1;
        continue;
      }

      const createdAt = file.metadata?.timeCreated ? Date.parse(file.metadata.timeCreated) : Number.NaN;
      if (!Number.isFinite(createdAt) || now - createdAt < minAgeMs) {
        retained += 1;
        continue;
      }

      candidates.push({
        name: file.name,
        ageHours: Math.floor((now - createdAt) / (60 * 60 * 1000)),
        prefix,
      });
    }
  }

  let deleted = 0;
  if (apply) {
    for (const candidate of candidates) {
      await bucket.file(candidate.name).delete({ ignoreNotFound: true });
      deleted += 1;
    }
  }

  console.log(JSON.stringify({
    mode: apply ? 'APPLY' : 'DRY_RUN',
    scanned,
    referenced: referenced.size,
    candidates: candidates.length,
    deleted,
    retained,
    candidateSample: candidates.slice(0, 100),
    note: 'Only objects under the four allowlisted prefixes are considered. Review the dry-run report before enabling deletion.',
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
