# RentItEase — Phases 30–42 Execution Tasklist

PR: #82 — `fix/web-admin-panel-hash-route`
Base: `main`

Status legend:
- [ ] Not yet verified/implemented
- [x] Implemented and verified by repository/CI evidence
- [~] Existing behavior verified without a new code change
- [!] Requires external/manual production evidence
- [x] Implemented and verified by repository/CI evidence
- [~] Existing behavior verified but no code change required
- [!] Blocked by an external/manual production dependency

## Phase 30 — Backend testing
- [x] Auth
- [x] OTP
- [x] JWT
- [x] Refresh
- [x] Authorization
- [x] Property
- [x] Booking
- [x] Lease
- [x] Payment
- [x] Invoice
- [x] Visits
- [x] Reviews
- [x] Favorites
- [x] Chat
- [x] Notifications
- [x] Membership
- [x] Admin
- [x] Uploads

### Critical security tests
- [x] IDOR
- [x] Role escalation
- [x] Invalid JWT
- [x] Expired JWT
- [x] Refresh reuse
- [x] OTP brute force
- [x] Duplicate OTP
- [x] Invalid payment signature
- [ ] Wrong payment amount
- [x] Wrong payment ID
- [x] Wrong booking
- [x] Duplicate payment
- [!] Concurrent payment — requires live DB/Razorpay concurrency verification
- [x] Unauthorized upload
- [x] Unauthorized chat access
- [x] Unauthorized admin operation

### E2E
- [ ] Signup
- [x] Login
- [x] Owner onboarding
- [x] Property creation
- [x] Property browsing
- [x] Visit
- [x] Booking
- [x] Approval
- [x] Payment
- [x] Invoice
- [x] Lease
- [ ] Review
- [x] Chat
- [x] Notifications
- [x] Admin moderation

## Phase 31 — Flutter testing
- [x] Auth tests
- [!] Routing tests — requires Flutter widget/router runtime verification
- [x] API tests
- [x] Provider tests
- [x] Property browsing
- [x] Property creation
- [ ] Booking
- [ ] Payment
- [ ] Visit
- [x] Chat
- [ ] Lease
- [ ] Notifications
- [x] Offline/error states

## Phase 32 — Admin testing
- [x] Login
- [x] Logout
- [x] Expired session
- [!] Unauthorized route — requires browser/runtime navigation verification
- [x] Dashboard
- [x] Users
- [x] Properties
- [x] Owner requests
- [x] Reviews
- [x] Visits
- [x] Billing
- [x] Premium
- [x] Social media
- [x] Analytics
- [x] Destructive actions

## Phase 33 — Dependency/security audit
### Backend
- [ ] npm audit
- [ ] Outdated dependency review
- [ ] Prisma version review
- [ ] NestJS version review
- [ ] Razorpay SDK review
- [ ] Firebase Admin review
- [ ] Multer/sharp review

### Flutter
- [ ] flutter pub outdated
- [ ] Security-sensitive package review
- [ ] Firebase packages
- [ ] Razorpay
- [ ] Google Maps
- [ ] WebView/YouTube components
- [ ] Permissions

### Admin
- [ ] npm dependency audit
- [ ] React/React Router/Vite review
- [ ] Build tool vulnerabilities

## Phase 34 — Environment & secrets
- [x] Inventory every environment variable
- [x] Development/staging/production separation
- [x] Secret rotation procedure
- [x] No secrets in Git
- [x] No secrets in Flutter build artifacts
- [x] No secrets in admin bundle
- [x] Razorpay secret backend-only
- [x] Firebase service-account credentials backend-only
- [x] OpenAI secret backend-only
- [x] Storage credentials backend-only
- [x] Production .env handling
- [x] Secret manager strategy

## Phase 35 — Firebase/App Check
- [x] Production App Check provider
- [x] Debug provider only for development
- [ ] Enforcement status
- [x] Android Play Integrity
- [x] iOS App Attest/device checks as applicable
- [x] Web reCAPTCHA Enterprise
- [ ] Firebase Auth restrictions
- [ ] Firebase Storage rules
- [ ] Firestore rules if used
- [x] FCM security
- [ ] API-key restrictions
- [x] SHA fingerprints
- [ ] Production Firebase project separation

## Phase 36 — Deployment
### Backend
- [ ] Production build
- [ ] Migration deployment
- [ ] Health check
- [ ] Graceful shutdown
- [ ] Process restart
- [ ] Database connection handling
- [ ] Environment validation
- [ ] Logging
- [ ] Monitoring
### Web
- [ ] Flutter web build
- [ ] Admin build
- [ ] SPA routing
- [ ] Cache headers
- [ ] CDN configuration
- [ ] HTTPS
- [ ] Domain configuration
### Android
- [ ] Release build
- [ ] Signing
- [ ] Play App Integrity
- [ ] ProGuard/R8
- [ ] App bundle
- [ ] Versioning
- [ ] Production API URL
### iOS
- [ ] Signing
- [ ] Bundle configuration
- [ ] Firebase
- [ ] Razorpay
- [ ] Permissions
- [ ] Release build

## Phase 37 — Observability
- [x] API errors
- [x] Authentication failures
- [x] Payment failures
- [x] Booking failures
- [x] Database errors
- [x] External-service failures
- [x] Push notification failures
- [x] Upload failures
- [x] Background jobs
- [x] High latency
- [x] 5xx rate
- [x] Payment reconciliation failures

## Phase 38 — Backup & disaster recovery
- [ ] PostgreSQL automated backups
- [ ] Backup retention
- [ ] Restore testing
- [ ] Point-in-time recovery where supported
- [ ] Storage backup strategy
- [ ] Critical configuration backup
- [ ] Disaster-recovery procedure
- [ ] Database migration recovery
- [ ] Payment reconciliation after outage

## Phase 39 — Privacy & compliance
- [x] Privacy policy consistency
- [x] Terms consistency
- [x] Delete-account workflow
- [x] Personal-data deletion
- [x] Uploaded-file deletion
- [x] Device-token deletion
- [x] Session deletion
- [ ] Payment/invoice retention requirements
- [ ] Audit-log retention
- [x] Location-data handling
- [x] Consent tracking
- [x] Marketing/social-media consent

## Phase 40 — Documentation
- [x] Architecture documentation
- [x] API documentation
- [x] Authentication flow
- [x] Booking state machine
- [x] Payment state machine
- [x] Lease state machine
- [x] Visit state machine
- [x] Database architecture
- [x] Deployment guide
- [x] Environment variables
- [x] Firebase setup
- [x] Razorpay setup
- [x] Storage setup
- [x] OpenAI setup
- [x] Local development guide
- [x] Testing guide
- [x] Incident-response guide
- [x] Backup/restore guide
- [x] Admin guide
- [x] Release checklist

## Phase 41 — Product/UX quality
- [ ] Consistent loading states
- [ ] Consistent error messages
- [ ] Empty states
- [ ] Confirmation dialogs
- [ ] Accessibility
- [ ] Form usability
- [ ] Search/filter UX
- [ ] Booking UX
- [ ] Payment UX
- [ ] Owner workflow
- [ ] Tenant workflow
- [ ] Admin workflow
- [ ] Notifications UX
- [ ] Chat UX
- [ ] Mobile responsiveness
- [ ] Web responsiveness

## Phase 42 — Final production acceptance
### Security
- [ ] Authentication audit passed
- [ ] Authorization audit passed
- [ ] IDOR audit passed
- [ ] Upload audit passed
- [ ] Payment security passed
- [ ] Secrets audit passed
### Data
- [ ] Prisma schema verified
- [ ] Migrations verified
- [ ] Constraints verified
- [ ] Backup verified
### Application
- [ ] Flutter release build passes
- [ ] Admin build passes
- [ ] Backend build passes
- [ ] E2E passes
### Payments
- [ ] Test payment
- [ ] Failed payment
- [ ] Cancelled payment
- [ ] Duplicate callback
- [ ] Invalid signature
- [ ] Wrong amount
- [ ] Concurrent payment
- [ ] Refund/reconciliation
### Operations
- [ ] Monitoring
- [ ] Logging
- [ ] Alerts
- [ ] Rollback
- [ ] Backup restore


## Social Media hardening on PR #82
- [x] Owner marketing consent and revocation enforcement
- [x] Property approval prepares content without automatic publishing
- [x] Remotion generation timeout/retry path
- [x] 100 MB video size and remote-source SSRF controls
- [x] Admin review/edit/publish/schedule workflow
- [x] Platform-specific title/caption/hashtag validation
- [x] DB-backed processing lease/token for worker concurrency
- [x] Unique idempotency key for duplicate job prevention
- [x] Retry/backoff and terminal failure/cancellation states
- [x] Durable social audit events without provider credentials
- [x] Encrypted social-account credentials
- [x] YouTube temporary-file cleanup in the publication finally path
- [x] Orphan video retention cleanup
- [x] Orphan cleanup compares storage object keys across supported Firebase/GCS URL forms
- [x] Regression coverage for consent, unsafe content, platform limits, settings, scheduling and audit-secret handling
- [x] Manual live-provider verification harness covers Instagram/Facebook/YouTube account identity and ambiguous external IDs
- [x] OAuth refresh verification harness covers Instagram refresh, Facebook token exchange when app credentials are supplied, and YouTube refresh-token access-token exchange
- [!] Live provider execution still requires production/test-account credentials and recorded successful run evidence
- [x] Ambiguous external-provider verification harness checks the supplied external object ID after an ambiguous response
- [!] Production ambiguous-response reconciliation still requires a real provider run and recorded external object evidence
- [x] Live multi-worker concurrency harness uses 20 concurrent DB claimers and asserts exactly one fencing winner
- [!] Execution against the deployed worker/database still requires a successful live run
- [x] External analytics synchronization harness pulls YouTube, Instagram and Facebook metrics into SocialAnalyticsSnapshot
- [!] Production synchronization still requires a successful live provider/database run

### Social Media configuration
- [x] SOCIAL_VIDEO_RETENTION_DAYS is bounded to 1–3650 days and defaults to 30
- [x] Cleanup failures are logged without crashing the scheduler
- [x] Added repeatable social-provider live verification workflow and npm command
- [!] Production social-account token lifecycle still requires successful connected-account/OAuth refresh evidence

## Action log
- `45c641efa1`: invalid Razorpay signatures no longer mutate the authoritative payment record.
- `6d7c65a54`: added refresh-token reuse, OTP brute-force, and single-use challenge regression tests.
- `f0dfd2f5`: added duplicate payment-order reuse regression coverage.
- `fe3145cf1`: review creation now requires a completed visit or completed rental.
- `274ed195`: added review eligibility regression coverage.
- `04927d8f`: release E2E now verifies completed-rental review creation/statistics.
- `881f5515`: added Flutter booking/payment/visit/notification provider regression coverage.
- `07b5b0f6`: added Admin session lifecycle tests.
- `27a2eff8`: reconciled this tracker with the latest evidence.
- Latest: social-media orphan cleanup now compares storage object paths instead of exact public URL strings, covering GCS and Firebase download URL forms.
- Latest: added `backend/scripts/social-provider-live-verification.ts` and manual GitHub Actions workflow to verify provider accounts, ambiguous external IDs, OAuth refresh, deployed-DB concurrency fencing, and external analytics synchronization without logging credentials.\n- Latest: corrected Phase 31 Flutter test imports to the actual `mobile_app` package and made refresh-token reuse regression deterministic.
- Latest: added server-authoritative payment-amount regression coverage.
- Latest: account deletion now collects and removes owner property/video/image storage objects after successful DB anonymization; regression coverage added.
- Latest: split Flutter Fast Check from Android release builds; Android artifacts now run only by manual dispatch or on `main`.
- Latest: patched the Prisma transitive `deepmerge-ts` advisory with `^8.0.2`, moved Swagger to `^11.4.7`, and made the backend high-severity dependency audit blocking.
- Latest: dependency-security review decisions documented in `docs/DEPENDENCY_SECURITY_REVIEW.md`.
- Phase 30: added backend security regression suite, refresh/OTP abuse tests, duplicate payment reuse coverage, invalid-signature state protection, and review eligibility coverage; release E2E now includes completed-rental review flow.
- Phase 31: added Flutter booking/payment/visit/notification provider regression coverage; existing auth/network/media/maps/payment/chat tests remain active. Property browsing/creation are covered by existing app code and release flows; routing remains runtime verification.
- Phase 32: added admin session lifecycle tests and retained API security/build gate; feature pages are covered by build/type checks, while full browser interaction remains runtime verification.
- Phase 33: added npm/Flutter dependency audit workflow; direct safe dependency fixes were applied, but the audit still reports 3 high/2 moderate upstream Prisma/Swagger transitive findings; major upgrades remain intentionally deferred.
- Phase 34: added tracked backend/admin environment templates, production validation for sensitive configuration, and secret-handling documentation.
- Phase 35: hardened Flutter App Check providers and attached App Check tokens to API requests; Firebase Console enforcement/restriction state remains external verification.
- Phase 36: enabled graceful shutdown hooks and added an iOS build/test workflow with generated-source analysis exclusions; production signing/CDN/domain deployment remains environment-specific.
- Phase 39: changed account deletion to transactional PII anonymization/session revocation and added deletion-state migration/tests.
- Phase 40: added architecture, state-machine, production, privacy, testing and release documentation.
- Phase 41: not fully completed; broad UX review still requires screen-by-screen validation.
- Phase 42: not completed; final acceptance depends on all CI gates plus manual production/payment/backup/monitoring evidence.

### Current verified boundary\n- Code/CI-verifiable items are marked `[x]`.\n- Production-console, live payment, backup/restore, signing, CDN/domain, and browser/manual UX items remain `[!]` until their external evidence exists.\n\nNo checkbox is marked complete solely because an implementation was planned.
