# Main-Branch UI Coverage Audit

**Audited ref:** `main` at `c581c1a72292bc2dc7a138d021ee698f99bedb81`  
**Audit type:** source and automated-test inventory; not a runtime visual QA pass.  
**Follow-up:** refreshed after PRs #99 (Google-only login UX) and #100 (role-route/admin UI state coverage).

## Summary

The repository contains a Flutter app and a separate React admin panel. CI passing confirms the configured checks passed on the audited commit; it does **not** prove that every screen, interaction, responsive state, or failure state is covered. Treat this document as a scoped inventory and follow-up checklist, not a claim of complete UI coverage.

## Screen and route inventory

### Flutter app

- **Public/web:** landing, about, contact, privacy, terms, delete-account, and legal-document routes.
- **Startup and authentication:** splash, onboarding, Google sign-in/authentication.
- **Tenant/customer:** home, property list, marketplace, listing, property details, search/filter, favorites, chat list/conversation, book visit, my visits, bookings, payment, reviews, notifications, profile/edit profile, premium membership, settings, maps/property map/map picker, and uploads.
- **Owner:** dashboard, add property, add marketplace listing, edit property, my properties, property details, enquiries, visits/visit requests, activity, and analytics.
- **Admin in Flutter:** admin dashboard.
- **Lease:** create lease.

The route table includes compatibility/redirect routes and parameterized routes (for example property ID, booking ID, and visit property ID). Direct entry, missing/invalid parameters, and unauthorized access should be tested explicitly.

### React admin panel

Routes/screens identified in `admin_panel/src/App.tsx` include Login, Dashboard, Users, Properties, Property document review, Owner requests, Reviews, Visits, Analytics, Billing, Premium memberships, and Social media. These are wrapped in the admin protected route/layout. Source inventory confirms screen definitions, not that every action works in production.

## Existing automated coverage observed

### Flutter

The repository includes app/widget smoke and authentication rendering tests, authentication provider tests, mobile admin navigation tests, chat conversation/send-message tests, payment configuration tests, tenant flow/model tests, provider regression tests, map-location privacy tests, network request-policy and response-envelope tests, media service tests, and localization tests. Google-only login is the intended product flow; obsolete OTP/password UI assumptions should not be reintroduced.

### Route access and admin UI state

PR #100 added route-access policy coverage for anonymous, tenant, owner, admin, and public web access, along with tenant UI-state and admin protected-route/dashboard state tests. This improves coverage but does not establish a complete route-by-route or action-by-action matrix.

### CI evidence at audit time

The following workflows passed on the audited main commit:

- [Release E2E / RC1](https://github.com/nammaengineer23/RentItEase/actions/runs/40201748068)
- [Backend CI](https://github.com/nammaengineer23/RentItEase/actions/runs/40201748111)
- [Flutter Fast Check](https://github.com/nammaengineer23/RentItEase/actions/runs/40201748103)
- [iOS Build](https://github.com/nammaengineer23/RentItEase/actions/runs/40201748055)
- [Dependency and Security Audit](https://github.com/nammaengineer23/RentItEase/actions/runs/40201748091)

These results are evidence for the configured checks on that commit only. They are not evidence of visual QA or exhaustive UI coverage. Cloudflare Workers Builds remains a separately deferred dashboard configuration/check.

## Remaining coverage work

- [ ] Maintain a route-to-role-to-test matrix from `app_router.dart` and `admin_panel/src/App.tsx`.
- [ ] Test direct entry, compatibility redirects, and invalid/missing route parameters.
- [ ] Add focused widget tests for marketplace listing/detail, add/edit property, visits/bookings, payments/leases, profile/settings, maps, notifications, favorites, and reviews.
- [ ] Expand React admin page/component tests for loading, empty, error, retry, validation, access-denied, and critical table/form actions.
- [ ] Add responsive and accessibility smoke checks for Flutter mobile/web and React admin narrow/desktop viewports, including keyboard navigation, semantics/labels, and touch targets.
- [ ] Verify the complete tenant, owner, and admin journeys against an explicitly verified isolated non-production environment. Never run destructive E2E tests against production.
- [ ] Keep marketplace sales/lease/site-sale validation separate from the general Release E2E gate. Enable marketplace flags only in staging until isolated marketplace, rental, booking, payment, and lease regressions pass.

## Scope and safety

This is a source/test inventory and CI snapshot, not a runtime visual QA pass or full code-coverage report. Production data was not modified as part of this audit. Do not infer that marketplace staging validation is complete from a merged PR or from general Release E2E passing.
