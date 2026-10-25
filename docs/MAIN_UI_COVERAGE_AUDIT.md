# Main-Branch UI Coverage Audit

**Audited ref:** `main` at `4354a9e0c27424ac47dff679eb286b101f4b7ee4`  
**Audit type:** source and test-inventory review; not a runtime visual QA pass.

## Summary

The repository contains substantial Flutter UI and a separate React admin panel. The current automated test inventory does **not** demonstrate that every screen, route, interaction, responsive state, or failure state is covered. Do not interpret successful builds as full UI coverage.

## Screen and route inventory

### Flutter app

- **Public/web:** landing, about, contact, privacy, terms, delete-account, legal-document routes.
- **Startup and authentication:** splash, onboarding, authentication, sign-in, register, forgot password.
- **Tenant/customer:** home, property list, marketplace, listing, property details, search/filter, favorites, chat list/conversation, book visit, my visits, bookings, payment, reviews, notifications, profile/edit profile, premium membership, settings, maps/property map/map picker, uploads.
- **Owner:** dashboard, add property, add marketplace listing, edit property, my properties, property details, enquiries, visits/visit requests, activity, analytics.
- **Admin in Flutter:** admin dashboard.
- **Lease:** create lease.

The route table also contains compatibility/redirect routes and parameterized routes (for example property ID, booking ID, and visit property ID); those need direct-entry and invalid-parameter tests.

### React admin panel

Routes/screens found in `admin_panel/src/App.tsx`:

- Login
- Dashboard
- Users
- Properties
- Property document review
- Owner requests
- Reviews
- Visits
- Analytics
- Billing
- Premium memberships
- Social media

These routes are wrapped in the admin protected route/layout. Source inventory confirms the screens exist, not that every action works or each state is tested.

## Existing Flutter test inventory

Tests found under `mobile_app/test`:

- App/widget smoke test and authentication-page render test
- Authentication provider tests
- A widget test for switching to OTP
- Mobile admin navigation sections
- Chat conversation/send-message integration-style widget test
- Payment configuration tests
- Tenant clean-flow model tests
- Phase 31 provider regression tests
- Map location privacy tests
- Network request-policy and response-envelope tests
- Media service tests
- Localization tests

This is useful coverage, but it is not a per-route UI matrix. The repository inventory did not show corresponding admin-panel page/component test files. Test presence alone also does not prove the tests are included in required CI or that they pass on the audited SHA; check workflow results for that separately.

## Confirmed audit findings

1. **Google-only authentication needs reconciliation.** The project’s established product requirement is Google Sign-In only, but the current Flutter route table still exposes sign-in, register, and forgot-password screens, and the widget test explicitly expects an OTP flow. Verify whether these are intentionally retained legacy screens; if Google-only is still the requirement, remove or redirect obsolete entry points and replace OTP/password UI tests with Google Sign-In-focused tests. Do not remove backend capabilities without checking their consumers.
2. **Route coverage is incomplete as a test strategy.** The visible widget tests do not exercise every route or role guard. Add a route matrix for guest, tenant/user, owner, and admin, including manual URL entry and unauthorized redirects.
3. **React admin UI tests are not evident in the source inventory.** Add tests for protected routing, loading/empty/error states, and critical table/form actions.
4. **State coverage is not demonstrated comprehensively.** For every data-backed page, test loading, success, empty, API failure, retry, validation, and permission-denied states where applicable.
5. **Responsive and accessibility checks are not demonstrated by the listed tests.** Include Flutter phone/tablet/web viewport checks and admin desktop/narrow viewport checks, keyboard navigation, semantics/labels, and minimum touch targets.
6. **End-to-end role flows need to be mapped to screen coverage.** Existing history records passing core E2E flows, but that is not evidence every UI route/state is covered. Run role-separated E2E only against the verified isolated E2E environment, never production.

## Required follow-up checklist

- [ ] Build a route-to-role-to-test matrix from `app_router.dart` and `admin_panel/src/App.tsx`.
- [ ] Decide and document the authentication UX: Google-only vs legacy password/OTP. Align routes, screens, and tests.
- [ ] Add route/guard tests for guest, tenant, owner, and admin.
- [ ] Add focused widget tests for marketplace listing/detail, add/edit property, visits/bookings, payments/leases, profile/settings, maps, notifications, favorites, and reviews.
- [ ] Add React admin tests for every page and critical actions.
- [ ] Add loading/empty/error/retry/validation/access-denied tests for data-backed pages.
- [ ] Add responsive/accessibility smoke tests for Flutter web/mobile and React admin.
- [ ] Run Flutter analyze/tests, admin lint/build/tests, and isolated role-based E2E; record exact run links and outcomes.
- [ ] Fix confirmed defects on this branch, keep production data untouched, and open a PR only after CI passes.

## Scope and limitations

This is a source/test inventory audit, not proof of runtime behavior. No production or staging user data was modified. No production E2E tests were run. The audit does not claim visual pixel-level validation or complete code coverage.
