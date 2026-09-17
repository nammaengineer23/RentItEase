# Post-merge corrections

- [x] Web background/minimize resume refresh preserves the current route.
- [x] True admin global record search across required admin data.
- [x] Booking invoice download uses the shared Android/web downloader.
- [x] Premium/subscription invoice download uses the shared Android/web downloader and clearly labels ₹0 complimentary trial vs paid Premium invoices.
- [x] Notification client response unwrapping retained from PR #64; backend visit/booking event notification creation is present and is being regression-checked by CI/E2E.
- [x] APK `/download` implementation retained from PR #64 with latest-release APK and fallback flow.
- [x] Tenant Home search/filter and normal ListView property scrolling retained from PR #64.
- [x] Tenant Visits search and Bookings status/search filters retained.
- [x] Property image/video and map/location corrections retained; production behavior requires web/device smoke verification after deployment.
- [x] Visit -> Booking -> Razorpay -> Invoice flow retained; invoice output is now cross-platform.
- [x] Owner booking filters and admin moderation/global-search changes retained.
- [ ] Final Backend CI, Flutter analyze/test/build and deployment checks must pass before merge.
