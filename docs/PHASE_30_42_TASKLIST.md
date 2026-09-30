# RentItEase — Phases 30–42 Execution Tasklist

PR: #82 — `fix/web-admin-panel-hash-route`
Base: `main`

Status legend:
- [ ] Not yet verified/implemented
- [x] Implemented and verified by repository/CI evidence
- [~] Existing behavior verified but no code change required
- [!] Blocked by an external/manual production dependency

## Phase 30 — Backend testing
- [ ] Auth
- [ ] OTP
- [ ] JWT
- [ ] Refresh
- [ ] Authorization
- [ ] Property
- [ ] Booking
- [ ] Lease
- [ ] Payment
- [ ] Invoice
- [ ] Visits
- [ ] Reviews
- [ ] Favorites
- [ ] Chat
- [ ] Notifications
- [ ] Membership
- [ ] Admin
- [ ] Uploads

### Critical security tests
- [ ] IDOR
- [ ] Role escalation
- [ ] Invalid JWT
- [ ] Expired JWT
- [ ] Refresh reuse
- [ ] OTP brute force
- [ ] Duplicate OTP
- [ ] Invalid payment signature
- [ ] Wrong payment amount
- [ ] Wrong payment ID
- [ ] Wrong booking
- [ ] Duplicate payment
- [ ] Concurrent payment
- [ ] Unauthorized upload
- [ ] Unauthorized chat access
- [ ] Unauthorized admin operation

### E2E
- [ ] Signup
- [ ] Login
- [ ] Owner onboarding
- [ ] Property creation
- [ ] Property browsing
- [ ] Visit
- [ ] Booking
- [ ] Approval
- [ ] Payment
- [ ] Invoice
- [ ] Lease
- [ ] Review
- [ ] Chat
- [ ] Notifications
- [ ] Admin moderation

## Phase 31 — Flutter testing
- [ ] Auth tests
- [ ] Routing tests
- [ ] API tests
- [ ] Provider tests
- [ ] Property browsing
- [ ] Property creation
- [ ] Booking
- [ ] Payment
- [ ] Visit
- [ ] Chat
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
- [ ] Inventory every environment variable
- [ ] Development/staging/production separation
- [ ] Secret rotation procedure
- [ ] No secrets in Git
- [ ] No secrets in Flutter build artifacts
- [ ] No secrets in admin bundle
- [ ] Razorpay secret backend-only
- [ ] Firebase service-account credentials backend-only
- [ ] OpenAI secret backend-only
- [ ] Storage credentials backend-only
- [ ] Production .env handling
- [ ] Secret manager strategy

## Phase 35 — Firebase/App Check
- [ ] Production App Check provider
- [ ] Debug provider only for development
- [ ] Enforcement status
- [ ] Android Play Integrity
- [ ] iOS App Attest/device checks as applicable
- [ ] Web reCAPTCHA Enterprise
- [ ] Firebase Auth restrictions
- [ ] Firebase Storage rules
- [ ] Firestore rules if used
- [ ] FCM security
- [ ] API-key restrictions
- [ ] SHA fingerprints
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
- [ ] API errors
- [ ] Authentication failures
- [ ] Payment failures
- [ ] Booking failures
- [ ] Database errors
- [ ] External-service failures
- [ ] Push notification failures
- [ ] Upload failures
- [ ] Background jobs
- [ ] High latency
- [ ] 5xx rate
- [ ] Payment reconciliation failures

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
- [ ] Privacy policy consistency
- [ ] Terms consistency
- [ ] Delete-account workflow
- [ ] Personal-data deletion
- [ ] Uploaded-file deletion
- [ ] Device-token deletion
- [ ] Session deletion
- [ ] Payment/invoice retention requirements
- [ ] Audit-log retention
- [ ] Location-data handling
- [ ] Consent tracking
- [ ] Marketing/social-media consent

## Phase 40 — Documentation
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Authentication flow
- [ ] Booking state machine
- [ ] Payment state machine
- [ ] Lease state machine
- [ ] Visit state machine
- [ ] Database architecture
- [ ] Deployment guide
- [ ] Environment variables
- [ ] Firebase setup
- [ ] Razorpay setup
- [ ] Storage setup
- [ ] OpenAI setup
- [ ] Local development guide
- [ ] Testing guide
- [ ] Incident-response guide
- [ ] Backup/restore guide
- [ ] Admin guide
- [ ] Release checklist

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
This file is updated as each phase is actually inspected, implemented, and verified. No checkbox is marked complete solely because an implementation was planned.
