# RentItEase Testing Guide

## Backend unit tests
Run `npm test -- --runInBand`. The PR backend CI now executes the full Jest unit suite rather than only the property-specific configuration.

Security regression coverage includes authentication failures, JWT refresh rejection, OTP hashing/expiry paths, booking/lease IDOR, payment order/signature checks, invoice access, visit access, duplicate reviews, chat membership, notification ownership, membership duplication and account deletion privacy controls.

## Backend release E2E
The release suite exercises auth, property, visits, booking, payment, invoices, leases, membership, favorites, chat, notifications and admin flows against the configured release API.

## Flutter
Run `flutter analyze` and `flutter test`. Integration coverage currently includes chat and the release workflow runs the full Flutter test suite.

## Admin
Run `npm ci && npm run lint && npm run build` in `admin_panel`. A dedicated browser-test framework is not yet part of the repository.

## Security audit
Run the repository security audit plus dependency audits. Never paste secrets into CI logs or test fixtures.
