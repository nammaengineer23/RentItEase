# RentItEase Release E2E

These tests are **remote HTTP E2E tests**. They do not create a Nest test application
and do not connect directly to PostgreSQL. This is intentional so GitHub Actions can
test the deployed Railway backend.

Authentication uses the backend's `login` field:

```json
{ "login": "...", "password": "..." }
```

## Run

```bash
cd backend
npx jest --config test/jest-release-e2e.json --runInBand
```

For only the sequential workflow:

```bash
npx jest --config test/jest-release-e2e.json release/release-workflow.e2e-spec.ts --runInBand
```

## Important

The supplied project snapshot contains a Prisma `Lease` model and `LeaseStatus`,
but no `leases.controller.ts` / `leases.module.ts` / lease service was present.
Therefore the Lease release test deliberately fails with a clear blocker until
the `/api/v1/leases` implementation exists.

Payment verification is deterministic for this backend: the service verifies
`HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId)` with
`RAZORPAY_KEY_SECRET`, so the release test can exercise the real verification
transition without storing card information.
