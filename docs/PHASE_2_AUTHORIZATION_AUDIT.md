# Phase 2 — Authorization / IDOR Audit

## Authorization pattern
1. Authentication — JwtAuthGuard.
2. Role authorization — RolesGuard + @Roles(...) where the operation is role-restricted.
3. Resource ownership / relationship — compare the authenticated user to the resource owner, tenant, membership owner, conversation participant, etc.
4. Business-state authorization — validate the resource state and allowed transition.
5. Operation — perform the read/write only after all checks pass.

Resource authorization belongs at the service boundary so callers cannot bypass it by reaching a service from another controller or internal path.

## Audit results
| Resource / boundary | Result | Evidence |
|---|---|---|
| Properties | PASS | Property update/delete/image/amenity paths verify ownerId; admin is explicitly allowed where appropriate. |
| Property images/videos | PASS | Image/video mutations verify property ownership and image-to-property relationship. |
| Property visits | PASS | Tenant/property-owner/admin checks are enforced; owner-only state transitions use a dedicated authorization helper. |
| Bookings | PASS | Reads require tenant/property-owner/admin relationship; create requires the authenticated tenant to own the source visit. |
| Leases | PASS | Reads require tenant/property-owner/admin; state transitions enforce owner/admin or tenant-specific rules. |
| Reviews | PASS | Update/delete require review.userId === user.id; create binds userId from the authenticated user. |
| Chat | PASS | Conversation reads/writes require owner/tenant participation; message edit/delete require sender ownership. |
| Favorites | PASS | Favorite operations use the authenticated user and property ID; no caller-supplied user ID controls the target account. |
| Notifications | PASS | Read/mark/delete queries bind notification.userId to the authenticated user. |
| Invoices | PASS | Invoice access checks invoice owner, booking property owner, or admin for ID, number, payment, and booking lookups. |
| Payments | PASS | Payment reads/refunds are constrained to booking tenant/property owner/admin; reconciliation is admin-only. |
| Premium listings | PASS | Listing reads/updates require listing ownership or admin; property promotion verifies property ownership and membership ownership. |
| Owner dashboard | PASS | Dashboard queries receive the authenticated user ID directly and are owner-scoped. |
| User settings/account | PASS | Settings controller passes only req.user.id; no arbitrary user ID is accepted. |
| User devices/push | PASS | Device registration and removal are bound to the authenticated user ID. |
| Owner social media | PASS | Owner controller requires OWNER role and consent lookup binds property consent to owner ID. |
| Admin operations | PASS | Admin controllers use JwtAuthGuard + RolesGuard + ADMIN; admin billing/social-media paths are class-protected. |
| Amenities | FIXED | Create/update/delete were previously unauthenticated. They are now JwtAuthGuard + RolesGuard + ADMIN; reads remain public. |
| Membership | FIXED | Legacy endpoints were previously unauthenticated and lacked ownership checks. Plan mutations are now ADMIN-only; user/membership reads and self-service mutations require authentication and service-level ownership checks; expiry operations are ADMIN-only. |

## High-risk IDOR cases checked
- User A changing a membership ID belonging to User B.
- User A reading User B's membership collection or active membership.
- User A reading User B's invoice through invoice ID, number, payment ID, booking ID, or membership ID.
- User A reading or modifying User B's booking.
- User A reading or modifying User B's lease.
- User A reading or modifying User B's review.
- User A reading or modifying User B's chat conversation/messages.
- User A changing another owner's property/images/video/amenities.
- User A changing another user's favorites or notifications.
- User A accessing another owner's dashboard.
- Non-admin access to admin billing, moderation, social-media, and admin user/property operations.

## Tests added
backend/src/modules/membership/membership.authorization.spec.ts covers cross-user membership collection rejection, cross-user membership-by-ID rejection, owner self-service update, and admin cross-user inspection.

## Release verification
Static/service-level authorization review is complete for the backend controllers identified in the Phase 2 audit. CI must pass before Phase 2 is closed.

Production/RC E2E should exercise two distinct authenticated identities against the same resource IDs for the critical tenant/owner/admin matrix before release.