# RentItEase State Machines

## Property
Draft → Submitted → Verified/Approved → Published → Booked → Occupied → Unavailable → Archived

Only authorized owner/admin actions may advance or alter lifecycle state. Verification and availability are server-controlled.

## Booking
PENDING → APPROVED → PAYMENT_PENDING → PAID → COMPLETED
Alternative terminal paths: PENDING → REJECTED/CANCELLED; PAYMENT_PENDING → CANCELLED.

## Payment
CREATED/PENDING → SUCCESS
Failure path: CREATED/PENDING → FAILED
Post-success refund path: SUCCESS → REFUNDED

## Lease
ACTIVE → COMPLETED
Alternative terminal paths: ACTIVE → TERMINATED/CANCELLED

## Visit
PENDING → APPROVED → COMPLETED
Alternative paths: PENDING → REJECTED/CANCELLED.

## Membership
PENDING → ACTIVE → EXPIRED
Alternative paths: PENDING → CANCELLED and ACTIVE → CANCELLED. Renewal creates a new payment-backed pending state before activation.

## Social publication
PENDING → GENERATING → READY → PUBLISHING → PUBLISHED
Failure/cancellation paths: any pre-published state → FAILED/CANCELLED. Durable idempotency keys and processing leases prevent duplicate publication across workers.
