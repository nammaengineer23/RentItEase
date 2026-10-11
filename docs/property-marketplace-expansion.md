# Property Marketplace Expansion: Sales, Leases, and Sites

## Goal

Extend RentItEase beyond monthly rentals with three additional transaction categories while preserving current rental behavior. This document records the implementation contract and rollout status; it does not itself enable these categories in production.

## Listing categories

Use a single explicit transaction category on each listing:

- `RENT`: existing rental behavior; no change to existing records or booking/payment flows.
- `LEASE`: longer-term lease offers with lease duration, deposit, renewal terms, and optional monthly rent.
- `SALE`: built residential/commercial property for outright purchase.
- `SITE_SALE`: vacant residential/commercial plot for purchase.

Do not infer a category from price or property type. Existing rows must retain `RENT` semantics during migration.

## Category-specific data

### Shared listing data
Title, description, owner, address/locality, city/state/country/pincode, coordinates, media, property type, availability, lifecycle/moderation status, and created/updated timestamps.

### RENT
Keep existing price, deposit, availability, booking, and payment behavior unchanged.

### LEASE
Lease term (duration and unit), lease deposit, optional monthly rent, renewal availability/terms, start/availability date, and lease-specific enquiry/visit flow. Model lease agreements separately from a standard rental booking when legal terms or payment structure differ.

### SALE
Asking price, negotiable flag, built-up area, plot area, bedrooms/bathrooms where applicable, and sale enquiry/site-visit flow. Do not route sale consideration through the existing rental payment flow.

### SITE_SALE
Asking price, total land area and unit, frontage/dimensions, facing, road access, land-use/zoning, layout approval details, survey/reference number, and site-visit flow. Keep legal-document identifiers private by default; expose only explicitly approved public details.

## Implementation status

- [x] Server-side `PROPERTY_MARKETPLACE_ENABLED` gate; only the exact value `true` enables non-rental categories.
- [x] Backward-compatible Prisma schema/migrations with existing listings retaining `RENT` semantics.
- [x] DTO validation, authorization, and category-aware search/filter support.
- [x] Flutter owner create/edit flows for sale, lease, and site categories. The Flutter screens are shared by the Android and Flutter Web app; visibility remains feature-flagged.
- [x] Authenticated `/property-enquiries` API for creating enquiries, viewing a user's enquiries, owner inbox, and status updates; feature-gated and rate-limited.
- [x] React Admin Panel document-review queue/status UI and audited admin endpoints.
- [x] Document-review states: `NOT_SUBMITTED`, `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`. Review status does not automatically verify ownership or publish a listing.
- [x] Backend tests, Flutter Fast Check, Admin CI, iOS validation, Prisma migration audit, and dependency/security audit passed on commit `ef7ec8927c3ec4da3f48614597ae01c7102d125a`.

## Feature-flagged rollout

1. Keep `PROPERTY_MARKETPLACE_ENABLED` disabled in production until deployment and isolated end-to-end/regression validation are complete.
2. Apply the additive Prisma migration to a non-production database first; validate migration recovery before any production rollout.
3. Verify each category's required and prohibited fields, category filters, and owner/admin authorization in an isolated environment.
4. Exercise buyer/tenant enquiry creation, owner inbox/status updates, rate limiting, and IDOR protections with isolated test accounts.
5. Re-run existing rental listing, booking, and payment regressions to confirm no behavior changes.
6. Confirm backend, Flutter Web/mobile, and admin deployments are compatible before enabling the flag in any environment.

## Safety and compatibility requirements

- Preserve existing API contracts and current rental workflows.
- Validate all monetary amounts and areas server-side; do not trust client-calculated totals.
- Apply owner authorization and existing IDOR protections to all new operations.
- Do not claim legal ownership or title validity solely from uploaded documents.
- Keep sale/site consideration out of Razorpay rental payment endpoints unless a separately reviewed purchase-payment design is approved.
- Keep private survey/reference identifiers out of public listing responses by default.
- Do not use the Release E2E / RC1 workflow against shared production data for PR validation; use isolated test infrastructure/accounts.

## Acceptance criteria

- Existing rental listings and bookings behave identically after migration.
- Owners cannot create sale/lease/site listings while the feature flag is off.
- When enabled in a test environment, each category validates only its relevant fields and is searchable by category.
- Sale/site enquiries and visits do not enter rental booking/payment/lease state machines.
- Admin moderation is auditable and document status is explicit.
- Backend tests, Flutter Fast Check, Admin CI when applicable, security audit, migration audit, and isolated E2E/regression checks pass before merge.
