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
- [x] Authenticated `/property-enquiries` API for creating enquiries, viewing a user's enquiries, owner inbox, and status updates; all four operations enforce the marketplace feature flag, and creation is rate-limited.
- [x] React Admin Panel document-review queue/status UI and audited admin endpoints.
- [x] Document-review states: `NOT_SUBMITTED`, `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`. Review status does not automatically verify ownership or publish a listing.
- [x] Backend tests cover marketplace enquiry flag-off behavior for create/read/update, listing eligibility, own-listing protection, IDOR protection, owner/admin status changes, and missing enquiry IDs.
- [x] Added focused property-service tests for invalid SALE asking prices, invalid SITE_SALE price/land area/unit, invalid LEASE duration, marketplace flag-off, and preservation of RENT creation when the flag is off.
- [x] At the previously recorded head `676516c805ec9e494ad9ea9c15aac3e04801d4d0`, Backend CI, Flutter Fast Check, Admin Panel CI, iOS Build, Prisma Migration Audit, and Dependency/Security Audit passed. New commits require fresh checks; do not treat those earlier results as validation of subsequent changes.

## Remaining tasks and release gates

### Implementation follow-ups
- [ ] Extend DTO-level validation and category-change tests, including contradictory stale fields when switching a listing between categories.
- [ ] Add controller/API-level authorization tests for all enquiry and document-review routes, not only service-level tests.
- [ ] Add document-review transition and audit tests, including requiring a reason for rejection if that becomes the chosen moderation policy.
- [ ] Add duplicate-submission/rate-limit and concurrent-update coverage where supported by the test infrastructure.
- [ ] Verify Flutter create/edit/reopen flows for each non-rental category, including loading, empty, error, retry, and duplicate-submit states.
- [ ] Verify public property serialization never returns `surveyReference` and review status never implicitly verifies or publishes a listing.

### Deployment and end-to-end gates
- [ ] Diagnose the latest failed Cloudflare Workers deployment from its actual build logs; dashboard logs are not available through the connected GitHub API, so the exact failure must be retrieved from the linked Cloudflare build.
- [ ] Run the worker SEO smoke test and validate the deployed home, SEO routes, sitemap, robots.txt, and admin panel.
- [ ] Apply and validate migrations against both a clean non-production database and a representative existing database.
- [ ] Run isolated marketplace E2E for SALE, LEASE, and SITE_SALE, including enquiries and owner status updates.
- [ ] Run rental regression tests for listing, booking, payment, and lease behavior.
- [ ] Re-run all affected GitHub Actions after the latest test commit and record the exact validated commit SHA here.
- [ ] Keep the PR in draft and production `PROPERTY_MARKETPLACE_ENABLED` disabled until deployment and isolated E2E/regression gates pass.

Do not run the Release E2E / RC1 workflow against shared production accounts/data for PR validation; it may create production fixtures or mutate shared data.

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
