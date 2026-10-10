# Property Marketplace Expansion: Sales, Leases, and Sites

## Goal

Extend RentItEase beyond monthly rentals with three additional transaction categories while preserving current rental behavior. This document defines the implementation contract for the feature branch; it does not itself enable these categories in production.

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

## Feature-flagged rollout

1. Add the server-side `PROPERTY_MARKETPLACE_ENABLED` flag. Only the exact value `true` enables non-rental categories; missing, false, or any other value keeps them disabled.
2. Introduce a backward-compatible Prisma schema migration. Existing records must default to `RENT`; migration must not rewrite rental pricing/deposit semantics.
3. Add strict DTO validation and authorization for category-specific fields. Reject fields that do not apply to the selected category.
4. Add search/filter support by transaction category and category-appropriate price/area fields.
5. Update owner listing creation/editing in Flutter and web. Hide new categories while the feature flag is OFF.
6. Add the authenticated `/property-enquiries` API for buyer/tenant enquiries, owner inbox, and status updates. It is separately feature-gated, owner-authorized, and rate-limited; sale/site enquiries must not create rental bookings or leases. Flutter and web surfaces remain outstanding.
7. Add admin moderation and explicit document-review states: `NOT_SUBMITTED`, `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`. An uploaded document must never imply verified ownership.
8. Add tests and regression coverage before enabling the flag in any environment.

## Safety and compatibility requirements

- Preserve existing API contracts and current rental workflows.
- Keep the feature disabled by default until migration, backend, admin, Flutter, and web support are all deployed.
- Validate all monetary amounts and areas server-side; do not trust client-calculated totals.
- Apply owner authorization and existing IDOR protections to all new operations.
- Do not claim legal ownership or title validity solely from uploaded documents.
- Keep sale/lease/site flows out of Razorpay rental payment endpoints unless a separately reviewed purchase-payment design is approved.
- Include migration rollback/forward-recovery notes and test on a non-production database before production deployment.

## Acceptance criteria

- Existing rental listings and bookings behave identically after migration.
- Owners cannot create sale/lease/site listings while the feature flag is off.
- When enabled in a test environment, each category validates only its relevant fields and is searchable by category.
- Sale/site enquiries and visits do not enter rental booking/payment/lease state machines.
- Admin moderation is auditable and document status is explicit.
- Backend tests, Flutter Fast Check, Admin CI when applicable, security audit, and E2E/regression checks pass before merge.
