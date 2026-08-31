# Release Checklist

## Before release

- [ ] Backend CI, RC1, and Flutter Android build pass on the release commit.
- [ ] Production health endpoint responds successfully.
- [ ] Tenant: search, details, favourite, chat, visit, booking, payment, invoice, and lease are smoke-tested.
- [ ] Owner: listing submission, pending approval, visits, dashboard, and analytics are smoke-tested.
- [ ] Admin: owner approval, property approval, filters, reviews, visits, billing, and analytics are smoke-tested.
- [ ] Google Maps and Places are tested with production keys.
- [ ] Firebase phone sign-in configuration and release SHA fingerprints are verified.
- [ ] Razorpay payment and invoice download are tested on a physical device.
- [ ] Public pages and support email are reachable.
- [ ] No RC1/E2E fixtures remain in production data.

## Rollback

If a release causes a production issue, revert the release commit, redeploy the last passing build, verify health and authentication, then communicate the incident through the support process.
