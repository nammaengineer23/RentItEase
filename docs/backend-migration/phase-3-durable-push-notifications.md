# Phase 3 — Durable push notification outbox

## Scope
PostgreSQL becomes the durable source of pending push work. Firebase Cloud Messaging (FCM) remains the delivery provider and existing notification/device-registration API contracts are preserved.

## Delivery flow
1. NotificationsService.createNotification inserts the in-app notification and NotificationOutbox event in one Prisma transaction. Failure to insert the outbox row rolls back the in-app insert.
2. Existing PushNotificationsService.sendToUser callers enqueue work rather than sending inline. If a matching recent in-app notification exists, its unique outbox event is enriched with navigation data instead of creating another event.
3. A background worker claims due events using PostgreSQL FOR UPDATE SKIP LOCKED, a per-claim lock token, and a stale-lock timeout. Multiple API instances can poll concurrently.
4. A per-device delivery ledger records status, attempt count, next retry time, and last error. Successful device deliveries are not normally resent when another device fails.
5. Transient failures use exponential backoff capped at one hour. Invalid/unregistered FCM tokens are removed. Disabled push preferences and users with no registered devices are marked skipped.

## Delivery semantics and duplicate prevention
The outbox and per-device ledger prevent lost queued work during restarts and avoid normal retry/fan-out duplicates. FCM does not accept an idempotency key for send operations, so strict exactly-once delivery cannot be guaranteed if the process crashes after FCM accepts a message but before PostgreSQL records success. Delivery is at-least-once in that narrow failure window.

## Configuration
- PUSH_OUTBOX_WORKER_ENABLED defaults to true; false pauses polling without deleting queued events.
- PUSH_OUTBOX_POLL_INTERVAL_MS defaults to 5000 (valid 1000–60000).
- PUSH_OUTBOX_BATCH_SIZE defaults to 10 (valid 1–100).

## Rollout and rollback
- The migration is additive and creates only outbox/delivery tables and indexes.
- Apply the migration before starting the new application version. Verify it in an isolated staging database first.
- Validate successful, retry, invalid-token, no-device, disabled-preference, and restart-recovery paths in staging.
- Set PUSH_OUTBOX_WORKER_ENABLED=false to pause delivery while preserving queued events.
- No production database tests, seed operations, migrations, or deployment are part of this PR.

## Test strategy
Unit tests mock Prisma and Firebase and do not connect to a database or Firebase project. Any migration/schema integration test must use a disposable isolated PostgreSQL database only.
