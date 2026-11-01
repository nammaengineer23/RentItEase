# Phase 4 — Storage hardening and controlled migration

**Baseline:** main after Phase 3 durable notification outbox.  
**Scope:** Repository-level storage audit and safe code hardening. This phase does not migrate objects or change production infrastructure.

## 1. Verified repository findings

- StorageService delegates to FirebaseService; the main upload path is Firebase Storage.
- No Cloudflare R2 adapter is present in the active storage module. However, STORAGE_DRIVER previously accepted r2 and required R2 credentials even though the service still wrote to Firebase. This was a dangerous configuration mismatch. The application now accepts only firebase and fails configuration validation for r2; no provider switch or object copy is attempted.
- The backend package still includes the Cloudinary SDK, but it is not the implementation behind StorageService. Social-video storage is a separate Firebase Admin path.
- Social-video uploads are deliberately made public by SocialMediaStorageService for publication workflows. That path has its own cleanup routine and PostgreSQL URL references.
- Legacy local files exist under backend/uploads and ServeStaticModule serves that directory at /uploads. This is a separate legacy delivery path and is not deleted or disabled by this phase.
- PostgreSQL stores Firebase object keys for property images, property videos and chat attachments. Social-video URLs are stored in social marketing/post records.
- Chat attachment upload and retrieval already check conversation owner/tenant membership and use short-lived signed URLs. Retrieval now additionally requires a non-deleted message in that conversation to reference the exact attachment key.
- The repository contains no Firebase Storage security-rules file. Console-side bucket rules, IAM and public-access settings are not observable from this repository audit and remain a staging/operations verification item.

## 2. Hardening implemented in this branch

- Reject unsupported STORAGE_DRIVER=r2 instead of silently routing writes to Firebase.
- Generate opaque UUID object names; do not place client-supplied filenames in storage keys.
- Restrict public upload folders to the known property media prefixes and private upload folders to chat/<conversationId>.
- Set public cache metadata on property media and private/no-store metadata on chat attachments.
- Validate actual image bytes using Sharp metadata and require the decoded format to match the declared JPEG/PNG/WEBP MIME type. GIF is no longer accepted by the backend image validator.
- Validate chat attachment signatures for the supported PDF, Office, text and audio formats.
- Keep legacy Firebase object keys under the approved prefixes addressable for deletion; reject keys outside those prefixes so a legacy R2 key cannot accidentally be deleted from Firebase.
- Upload property image objects before changing database primary-image state; persist image metadata and primary-image changes in one Prisma transaction. Best-effort cleanup removes newly uploaded objects if persistence fails.
- Delete property video objects before clearing PostgreSQL references, so a storage failure leaves the existing reference available for retry. Video replacement is blocked for non-Firebase legacy keys pending controlled migration.
- Change storage:reconcile to dry-run by default. Deletion requires both --apply and STORAGE_RECONCILE_ALLOW_DELETE=true; production deletion also requires STORAGE_RECONCILE_ALLOW_PRODUCTION=true. The script inventories property images, property videos, chat attachments and social-video URL references; it only considers allowlisted prefixes and retains objects without a valid creation timestamp.

## 3. Migration safeguards

No production object listing, copy, delete, database migration or deployment is performed by this PR.

Before any object migration:
1. Verify the actual Railway production STORAGE_DRIVER, Firebase project/bucket, bucket IAM and Firebase Storage rules in the console.
2. Produce a read-only inventory of Firebase objects, legacy local /uploads files, and any confirmed R2/Cloudinary objects. Do not infer provider ownership from a URL string alone.
3. Export a mapping of PostgreSQL record ID, current provider, object key/URL, visibility, MIME type, byte size and checksum.
4. Build an idempotent copy tool with a dry-run manifest. Copy to a new destination key, verify byte count and checksum, and only then update the PostgreSQL reference in a separately reviewed batch.
5. Keep source objects and old URLs available throughout the rollback window. Do not delete source objects as part of copy or DB-reference updates.
6. Validate public property image/video URL compatibility and negative cross-account tests for private chat attachments in isolated staging.
7. Reconcile only after all provider references have been inventoried. Keep dry-run as the default and require explicit approval before applying deletions.

## 4. Required staging verification

- Firebase public property image upload, read, replacement and deletion.
- Genuine image bytes accepted; MIME spoofing, malformed images, unsupported formats and oversized files rejected.
- Property owner/admin authorization; unrelated user cannot upload, reorder, promote or delete another owner's media.
- Property video upload/replacement/deletion; storage failures must not silently clear existing DB references.
- Chat upload only for conversation participants; unrelated user denied.
- Chat download denied for non-participants, guessed object keys, keys not referenced by a live message, deleted messages and path traversal attempts.
- Signed chat URL is short-lived; direct public URL/token access to private objects is not available.
- Reconciliation dry-run reports only; default invocation deletes zero objects. Apply mode requires explicit gates and must be tested only against disposable staging storage.
- Legacy local /uploads and social-video public delivery remain unchanged.

All integration tests that need PostgreSQL or Firebase must use disposable isolated staging resources. Never run mutation, seed, cleanup or reconciliation apply commands against production as part of this phase.
