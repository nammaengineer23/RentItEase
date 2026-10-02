# Privacy and Data Lifecycle

## Account deletion
Account deletion is implemented as transactional PII anonymization rather than destructive deletion of financial records. The workflow:
- revokes devices and refresh tokens;
- removes OTP/reset/session-adjacent personal records;
- removes favorites, reviews, feedback and user settings;
- replaces authored chat text with a deleted marker;
- revokes social-marketing consent;
- replaces name/email/phone/photo with non-identifying values;
- disables the account and records `deletedAt`.

Administrator self-deletion is blocked and must use the administrative security workflow.

## Financial records
Payments, invoices, memberships and booking/lease records may need to remain for accounting, fraud prevention and reconciliation. They are retained against the anonymized account rather than preserving direct personal identity.

## Uploaded files
Application code must delete stored objects when the owning record is intentionally removed. Storage adapters validate ownership/path before deletion. Production cleanup of orphaned objects should be monitored.

## Device/session data
Device tokens and refresh tokens are revoked/deleted during account deletion and logout/session expiry.

## Location
Client location is permission-gated, timeout-bounded and privacy-rounded before persistence/use where applicable.

## Consent
Marketing/social consent is property-owner scoped, versioned and auditable. Revocation cancels pending publication work.

## Required legal review
Privacy policy, terms, retention periods and any statutory payment/invoice retention requirements must be reviewed against the jurisdictions in which RentItEase operates before production acceptance.
