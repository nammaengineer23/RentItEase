# RentItEase Release Checklist

## Before merge
- Backend lint/build/unit tests pass.
- Dependency audit passes or documented exceptions exist.
- Flutter analyze/tests pass.
- Admin lint/build pass.
- Prisma schema and migration history are reviewed.
- No secrets or private keys are committed.

## Before production
- Production environment variables are present in the secret manager.
- Firebase production project/apps are registered.
- App Check production providers and enforcement are verified in Firebase.
- Android Play Integrity/signing and iOS App Attest/DeviceCheck are verified.
- Razorpay production credentials are backend-only.
- Backups and restore procedure are verified.
- Monitoring/alerts are active.
- Rollback procedure is tested.

## Payment acceptance
Test successful, failed, cancelled, duplicate callback, invalid signature, wrong amount/order, concurrent payment and refund/reconciliation paths.

## Final gate
Do not mark a manual infrastructure or provider-console item complete from source-code evidence alone.
