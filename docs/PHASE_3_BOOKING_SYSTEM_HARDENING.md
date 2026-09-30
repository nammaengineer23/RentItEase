# Phase 3 — Booking System Hardening

## 3.1 Booking creation

- Validate property exists: enforced through the approved visit relation lookup.
- Validate property is active/available: `isAvailable` is checked before booking creation.
- Validate property is verified: `isVerified` is required for booking creation.
- Validate tenant eligibility: only USER/OWNER accounts may create a booking and the authenticated user must own the approved visit.
- Prevent owner booking own property: enforced by comparing authenticated user ID with property owner ID.
- Prevent duplicate active bookings: application check plus database-unique `Booking.activePropertyKey`.
- Prevent booking unavailable property: enforced by availability checks and the database active-booking guard.
- Validate requested dates: the current booking model is visit-driven rather than rental-date-driven; the approved visit date must still be in the future.
- Validate rent/security amounts server-side: booking amounts are copied from the server-side property values; the client cannot submit either amount.

## 3.2 Booking state machine

Allowed transitions:

```text
PENDING
 ├──> APPROVED ──> PAYMENT_PENDING ──> PAID ──> COMPLETED
 ├──> REJECTED
 └──> CANCELLED

APPROVED ───────────────> CANCELLED
PAYMENT_PENDING ────────> CANCELLED

REJECTED / CANCELLED / COMPLETED are terminal.
```

The transition table is centralized in `backend/src/modules/booking/booking-state-machine.ts` and illegal transitions throw `BadRequestException`.

Mutation endpoints do not accept a client-controlled status field. State-changing operations use conditional database updates (`id + expected status`) so a concurrent request cannot overwrite a newer state.

Payment verification uses the same transition rules and conditionally moves `PAYMENT_PENDING -> PAID` while marking the property unavailable in the same transaction.

## 3.3 Race-condition protections

- Two tenants booking simultaneously: `activePropertyKey` is nullable and unique, so only one active booking can claim a property.
- Two payment sessions for one booking: `paymentOrderCreationKey` is a unique booking-level creation claim; concurrent order creation attempts cannot both contact Razorpay successfully.
- Owner approving after another booking succeeds: approval requires the booking to still be `PENDING`; payment atomically moves its booking to `PAID` and the property to unavailable.
- Property becoming unavailable during payment: payment completion conditionally updates the property from available to unavailable inside the payment transaction; otherwise the transaction aborts.
- Duplicate API requests: booking uniqueness and conditional state updates make retries safe at the state boundary.
- Concurrent cancellation/payment: both operations require the expected current state, so only one legal transition can win.
- Database protection: unique active-booking/payment-creation keys plus conditional updates provide database-backed race protection.

## Verification

The booking state machine has dedicated unit tests covering every legal transition and representative illegal transitions. Backend CI must pass Prisma validation/generation, lint, build, the complete unit suite, and security/configuration audit before this phase is closed.
