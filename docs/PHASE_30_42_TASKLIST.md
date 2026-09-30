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
- [ ] Refresh reuse
- [ ] OTP brute force
- [ ] Duplicate OTP
- [ ] Invalid payment signature
- [ ] Wrong payment amount
- [x] Wrong payment ID
- [x] Wrong booking
- [ ] Duplicate payment
- [ ] Concurrent payment
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
- [ ] Routing tests
- [x] API tests
- [x] Provider tests
- [ ] Property browsing
- [ ] Property creation
- [ ] Booking
- [ ] Payment
- [ ] Visit
- [x] Chat
- [ ] Lease
- [ ] Notifications
- [ ] Offline/error states

## Phase 32 — Admin testing
- [ ] Login
- [ ] Logout
- [ ] Expired session
- [ ] Unauthorized route
- [ ] Dashboard
- [ ] Users
- [ ] Properties
- [ ] Owner requests
- [ ] Reviews
- [ ] Visits
- [ ] Billing
- [ ] Premium
- [ ] Social media
- [ ] Analytics
- [ ] Destructive actions

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
- [ ] Uploaded-file deletion
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

## Action log
- Phase 30: added backend security regression suite; expanded backend CI to run the complete Jest unit suite.
- Phase 31: added Flutter authentication provider tests; existing network/media/maps/payment/chat tests remain active.
- Phase 32: added executable admin API security tests and a dedicated admin CI gate.
- Phase 33: added npm/Flutter dependency audit workflow; direct safe dependency fixes were applied, but the audit still reports 3 high/2 moderate upstream Prisma/Swagger transitive findings; major upgrades remain intentionally deferred.
- Phase 34: added tracked backend/admin environment templates, production validation for sensitive configuration, and secret-handling documentation.
- Phase 35: hardened Flutter App Check providers and attached App Check tokens to API requests; Firebase Console enforcement/restriction state remains external verification.
- Phase 36: enabled graceful shutdown hooks and added an iOS build/test workflow with generated-source analysis exclusions; production signing/CDN/domain deployment remains environment-specific.
- Phase 39: changed account deletion to transactional PII anonymization/session revocation and added deletion-state migration/tests.
- Phase 40: added architecture, state-machine, production, privacy, testing and release documentation.
- Phase 41: not fully completed; broad UX review still requires screen-by-screen validation.
- Phase 42: not completed; final acceptance depends on all CI gates plus manual production/payment/backup/monitoring evidence.

No checkbox is marked complete solely because an implementation was planned.
