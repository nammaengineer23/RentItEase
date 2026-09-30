# Phase 5 — Money / Data Model Hardening

## 5.1 Monetary fields

The Prisma schema stores financial state as PostgreSQL `Decimal(10,2)`, not `Float`/JavaScript floating point:

| Domain | Field | Storage |
|---|---|---|
| Property | `price` | Decimal(10,2) |
| Property | `dailyRent` | Decimal(10,2) |
| Property | `securityDeposit` | Decimal(10,2) |
| Booking | `monthlyRent` | Decimal(10,2) |
| Booking | `securityDeposit` | Decimal(10,2) |
| Lease | `monthlyRent` | Decimal(10,2) |
| Lease | `securityDeposit` | Decimal(10,2) |
| Invoice | `amount` | Decimal(10,2) |
| Invoice | `taxAmount` | Decimal(10,2) |
| Invoice | `totalAmount` | Decimal(10,2) |
| MembershipPlan | `price` | Decimal(10,2) |
| Membership | `amount` | Decimal(10,2) |
| PremiumListing | `amount` | Decimal(10,2) |
| Payment | `amount` | Decimal(10,2) |
| PaymentRefund | `amount` | Decimal(10,2) |

`area`, latitude, and longitude are intentionally not monetary fields.

### Application rules

Financial calculations now use Prisma Decimal arithmetic. Gateway conversion is performed exactly once at the boundary with a shared `toPaise()` utility:

- values must be finite and non-negative;
- values must have at most two decimal places;
- the paise result must be a safe integer;
- no rent/deposit/payment sum is performed with JavaScript floating-point addition.

The payment amount for a booking is calculated as:

```
monthlyRent + securityDeposit
```

using Decimal arithmetic.

Premium membership payment amounts are taken from the persisted active membership plan price. The client cannot select the monetary amount.

Premium listing monetary fields are server-controlled; client-supplied amount/currency fields were removed from the DTOs.

### Tests

`backend/test/money-data-model.spec.ts` verifies:

- exact Decimal addition;
- exact two-decimal-to-paise conversion;
- rejection of fractional paise;
- rejection of negative monetary state.

## 5.2 Reconciliation model

### Booking payment

The database relationship is:

```
Booking 1 ─── 1 Payment
              │
              ├── razorpayOrderId (unique)
              ├── razorpayPaymentId (unique)
              └── amount / currency
```

The backend reconciles all three values against Razorpay before recording success.

Razorpay's security checklist recommends obtaining order IDs from a trusted source such as the database, validating signatures, and fetching captured payment amounts from the backend/trusted source. Razorpay security checklist: https://razorpay.com/security/checklist

### Invoice

A payment can now have at most one invoice at the database level:

```
Payment 1 ─── 0..1 Invoice
```

`Invoice.paymentId` is unique, while membership/trial invoices may legitimately have a null payment reference.

The payment success transaction also uses the deterministic invoice number `RIE-<bookingId>` and an upsert.

### Membership payment

Membership payments remain a separate gateway-backed billing flow. The Membership record stores:

- `amount`
- `razorpayOrderId` (unique)
- `razorpayPaymentId` (unique)
- `razorpaySignature`
- `paidAt`

The amount is copied from the persisted `MembershipPlan.price`, and successful verification now fetches the Razorpay Order and Payment and requires matching amount, INR currency, order/payment IDs, and captured status.

The membership invoice is deterministically linked through `RIE-PREM-<membershipId>`.

### Refund

The relationship is:

```
Payment 1 ─── N PaymentRefund
```

Multiple processed refunds are supported for partial-refund reconciliation. Each Razorpay refund ID is unique.

Refund reconciliation validates:

- original Razorpay payment ID;
- refund amount;
- currency;
- gateway refund status;
- local refund status;
- cumulative refund state before marking the original payment fully refunded.

An active refund claim prevents duplicate local refund attempts.

### Reconciliation endpoint

The administrator-only payment reconciliation operation checks:

- payment ↔ booking;
- payment ↔ invoice;
- invoice amount/currency ↔ payment;
- booking payment state;
- property availability after successful payment;
- full refund state;
- unreconciled active refunds.

This provides an explicit database consistency check instead of assuming that gateway callbacks alone imply local consistency.

## Phase 5 completion gate

Phase 5 is complete only after:

- Prisma validation succeeds;
- backend build succeeds;
- lint succeeds;
- full unit suite succeeds;
- money regression tests succeed;
- payment reconciliation tests succeed;
- security/configuration audit succeeds.
