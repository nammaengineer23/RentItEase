# Phase 7 — Property System Hardening

## Lifecycle

The property lifecycle is now explicit and server-controlled:

`DRAFT → SUBMITTED → VERIFIED → PUBLISHED → BOOKED → OCCUPIED → UNAVAILABLE → ARCHIVED`

The implementation keeps the legacy `isVerified` and `isAvailable` fields during the transition so existing consumers remain compatible, but lifecycle status is the authoritative workflow state.

### State rules

- **DRAFT** — owner can prepare a listing; it is never public.
- **SUBMITTED** — owner changes requiring review wait for admin verification.
- **VERIFIED** — admin approval has passed; the property is not public until published.
- **PUBLISHED** — publicly discoverable and bookable.
- **BOOKED** — an active booking reserves the property and removes it from public discovery.
- **OCCUPIED** — an active lease exists.
- **UNAVAILABLE** — hidden from public discovery without deleting the record.
- **ARCHIVED** — terminal soft-deleted state.

Illegal lifecycle transitions are rejected by `property-lifecycle.ts`.

## Ownership and authorization

- Property creation is owner-only.
- Property edits require the authenticated owner or admin.
- Owner edits never accept `ownerId`, `isAvailable`, `isVerified`, `lifecycleStatus`, timestamps, or other lifecycle authority fields.
- Owner edits to an existing non-draft listing reset it to `SUBMITTED` and require another review.
- Booked, occupied, and archived properties cannot be edited.
- Owner/admin media mutations follow the same lifecycle restrictions.
- DELETE is now an archive operation rather than a hard delete.

## Verification, hide/unhide and publishing

- Owner submits with `POST /properties/:id/submit`.
- Admin verification is performed through the admin property approval workflow.
- Publishing requires verified state.
- Hiding moves a published/verified property to `UNAVAILABLE`.
- Unhide/publish requires verified state.
- Admin's generic property status override routes through the same lifecycle service instead of directly mutating lifecycle booleans.

## Availability synchronization

Booking creation atomically changes:

`PUBLISHED → BOOKED`

Lease creation atomically changes:

`BOOKED → OCCUPIED`

Lease completion/termination/cancellation changes the property back to:

`OCCUPIED → PUBLISHED`

Booking rejection/cancellation/completion releases a booking reservation back to `PUBLISHED` when no lease is active.

These transitions use database transactions and conditional updates so a concurrent request cannot silently publish or reserve the same property.

## Images and video

- Uploads remain owner/admin authorized.
- Media mutations are blocked for `BOOKED`, `OCCUPIED`, and `ARCHIVED`.
- Owner media edits on an already-reviewed listing force a fresh `SUBMITTED` review.
- Public image reads are restricted to published properties.
- Existing content validation and storage cleanup behavior remains in force.

## Amenities

- Amenity IDs are validated against the canonical Amenity table before assignment.
- Unknown amenity IDs are rejected.
- Amenity replacement is transactional.
- Owner amenity changes follow the same review/lifecycle rules.
- Admin may manage property amenities without taking ownership of the property.

## Location validation and privacy

- Latitude and longitude must be supplied together.
- Coordinates are validated as legal latitude/longitude values.
- Indian pincodes are validated using the `IN` postal-code validator.
- Property location strings have bounded lengths.
- Public property responses round latitude/longitude to three decimal places (approximately 100 m scale) instead of exposing the stored six-decimal coordinates.
- Public property details, search, home collections, nearby search, similar listings, and public media reads require `PUBLISHED` state.

## Search and nearby performance

- Public listing queries are lifecycle-filtered and availability-filtered server-side.
- Pagination is capped at 50 records per page.
- Sort fields are allowlisted.
- Nearby search radius is bounded to 50 km.
- Nearby search applies a latitude/longitude bounding box in the database before the exact Haversine distance calculation in application code.
- Added indexes:
  - `Property(lifecycleStatus, createdAt)`
  - `Property(lifecycleStatus, city, createdAt)`
  - `Property(latitude, longitude)`

This avoids loading every geolocated property into application memory for each nearby request.

## Migration

Migration:

`20260930200000_add_property_lifecycle`

The migration:

1. creates the lifecycle enum;
2. adds the lifecycle column;
3. backfills existing records conservatively from verification/availability state;
4. upgrades active leases to `OCCUPIED`;
5. upgrades active bookings to `BOOKED`;
6. creates lifecycle and geolocation indexes.

The migration follows an expand/backfill approach so the existing availability fields remain compatible during rollout.

## Tests

Dedicated tests:

- `property-lifecycle.spec.ts`
  - valid lifecycle path
  - illegal transitions
  - archived terminal behavior
- `property-security.spec.ts`
  - public lifecycle filtering
  - coordinate privacy rounding
  - service-boundary lifecycle field rejection
  - cross-owner update rejection
  - draft creation invariants

The existing property, property-image, booking, lease, payment, Prisma, and full backend suites remain required CI gates.

## CI gate

Phase 7 is not complete until:

- Prisma validation passes.
- Prisma migration history applies cleanly to a fresh PostgreSQL database.
- Prisma live-schema diff passes.
- Backend build passes.
- Full backend unit suite passes.
- Dedicated property lifecycle/security tests pass.
- Admin CI passes.
- Flutter Fast Check passes.

