# Phase 4 — Razorpay Payment Security Hardening

## Scope

This phase hardens the payment boundary where RentItEase moves a booking from approved/payment-pending to paid.

Razorpay's current security guidance requires server-side order IDs and amounts, callback signature validation, backend verification of captured status/amount, and HMAC validation for webhooks. urlRazorpay security checklisthttps://razorpay.com/security/checklist

## 4.1 Order creation

The backend is the sole authority for the payment amount:

- Mobile/client amount fields are not used.
- Amount is calculated from the persisted booking `monthlyRent + securityDeposit`.
- Currency is fixed to INR.
- Booking ownership is checked against the authenticated tenant.
- Only APPROVED or PAYMENT_PENDING bookings can enter payment.
- Property availability is rechecked immediately before reserving the payment attempt.
- A successful payment cannot create another order.
- The Payment row is unique per booking.
- A deterministic Razorpay receipt (`booking_<bookingId>`) is used to reconcile a network timeout before retrying order creation.
- A booking-level order-creation claim prevents concurrent callers from creating duplicate gateway orders.
- Stale local creation claims can be safely reclaimed.
- The database unique constraint on `Payment.orderCreationToken` provides an additional concurrency boundary.

## 4.2 Signature and gateway verification

The checkout callback is not trusted by itself.

Before success is recorded the backend:

1. Requires the Razorpay order ID to equal the trusted order ID stored in the Payment row.
2. Computes HMAC-SHA256 over `order_id|payment_id`.
3. Compares signatures using a constant-time comparison.
4. Fetches the Razorpay Order and Payment from the gateway.
5. Requires the gateway order ID, payment ID, amount, and currency to match the local transaction.
6. Requires gateway payment status to be `captured`.
7. Requires the authenticated caller to be the booking tenant (or an authorized administrator).
8. Rejects unavailable properties and invalid booking states before committing success.
9. Never changes a legitimate pending/created Payment record when the supplied signature is invalid.

Razorpay documents server-side signature validation and backend verification of captured payment status/amount. urlRazorpay payment integration guidancehttps://razorpay.com/docs/server-integration/python/test-app/

## 4.3 Atomic success transition

The success path is implemented as one database transaction:

```text
Payment SUCCESS
      +
Booking PAID
      +
Property unavailable
      +
Invoice PAID
```

The transaction:

- conditionally claims the Payment, so only one concurrent verifier can succeed;
- conditionally transitions the Booking from PAYMENT_PENDING/APPROVED to PAID;
- conditionally marks the Property unavailable;
- upserts the deterministic invoice number `RIE-<bookingId>`;
- returns the existing successful Payment when a concurrent verifier already completed the transaction;
- retries Prisma serialization conflicts (P2034) with bounded backoff.

This prevents a second successful callback from creating a second invoice or performing the booking/property transition twice.

Notifications are emitted only after a transaction that actually claimed the payment. Duplicate webhook events are suppressed by the `PaymentWebhookEvent.eventId` unique ledger.

## 4.4 Webhooks

Endpoint:

`POST /api/v1/payments/webhook`

NestJS is configured with `rawBody: true`, so the webhook HMAC is calculated over the original request bytes.

The endpoint:

- requires `RAZORPAY_WEBHOOK_SECRET`;
- validates `X-Razorpay-Signature` with HMAC-SHA256 and constant-time comparison;
- requires `X-Razorpay-Event-Id`;
- stores the event in `PaymentWebhookEvent`;
- treats PROCESSED/IGNORED events as idempotently complete;
- retries events previously marked FAILED;
- reconciles `payment.captured` by fetching Order and Payment from Razorpay;
- handles `payment.failed`;
- handles `refund.created`, `refund.processed`, and `refund.failed`;
- records gateway refund IDs and reconciles uncertain refunds without creating another refund;
- exposes an administrator-only payment reconciliation endpoint.

Razorpay recommends HMAC validation for webhooks and using API fetches alongside asynchronous webhook processing for critical payment confirmation. urlRazorpay payment integration guidancehttps://razorpay.com/docs/server-integration/python/test-app/

### Required production configuration

Configure in the production environment:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

In the Razorpay Dashboard, configure the webhook URL for the production API and subscribe to the payment/refund events required by the application.

The webhook secret must be different from the API key secret and must never be shipped to mobile/web clients.

## Verification evidence

Regression coverage is in:

- `backend/test/payments-security.spec.ts`
- `backend/test/payments-reconciliation.spec.ts`

The security regression suite covers:

- invalid signature does not mutate a pending payment;
- gateway amount mismatch is rejected;
- order/payment relationship mismatch is rejected;
- non-captured payment is rejected;
- property unavailability blocks verification;
- payment success transaction retries serialization conflicts;
- payment success is idempotent;
- webhook event replay is idempotent;
- failed webhook processing can be retried;
- refund reconciliation does not create duplicate refunds.

Phase 4 should only be marked complete after Backend CI passes the full unit suite, Prisma validation/generation, lint, build, and security checks.
