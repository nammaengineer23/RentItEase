# Final release PR audit

Audit date: 2026-09-13

All 53 pull requests were checked against `main` and the physical-device
findings from the APK served by `releases/latest`.

## PR status

- Merged: #1, #2, #5–#7, #10–#22, #25–#29, #31, #32, #34–#36,
  #46–#49, and #51–#53.
- Closed without merge: #3, #4, #8, #9, #23, #24, #30, #33,
  #37–#45, and #50.
- The unmerged PRs were largely superseded by later integration PRs, especially
  #5, #10, #16, #25, #28, #34, #35, #36, #49, #51, and #52. Their branch
  commits must not be merged wholesale because that would reintroduce stale
  snapshots and duplicate changes.

## Why the tested APK still showed old defects

The website points to:

`https://github.com/nammaengineer23/RentItEase/releases/latest/download/RentItEase-release.apk`

The repository version and release workflow still defaulted to v1.0.0+1.
Current `main` already contains UI that was absent from the tested APK, including
the pre-created property conversation, its property header, and owner visit
filters. Therefore the website was serving an older GitHub Release artifact,
not an APK built from the latest `main`.

## Consolidated release blockers

This PR owns only the remaining or defensively required changes:

1. Sort tenant and owner visit requests newest first.
2. Add tenant visit status filters; retain the existing owner filters.
3. Prevent owners from seeing Book Visit or Chat actions on their own listings.
4. Include owner names in property responses and tolerate both conversation
   response shapes.
5. Refresh property cards after returning from details so view counts agree.
6. Serialize membership Decimal values in the API and safely format legacy
   Decimal payloads in the app.
7. Publish a distinct v1.0.1+2 APK from the `API_BASE_URL` secret and record the
   source commit in release notes.
8. Keep Google Sign-In available while hiding Phone OTP in the
   website-sideloaded APK. Email/password registration does not require an OTP,
   and the registration phone number remains optional.

## Existing safeguards retained

- `backend/scripts/cleanup-e2e-data.ts` already supports a dry run, an explicit
  `--include-legacy` scope, and a separate confirmation variable before any
  deletion. It preserves real users, non-E2E plans, migrations, and database
  infrastructure.
- Public property queries already require `isVerified: true` in current `main`.
- Property Details already creates or retrieves a conversation before opening
  Chat in current `main`.

## Required release sequence

1. Merge this PR only after Backend and Flutter CI pass.
2. Confirm Railway deploys the merge commit.
3. Run the cleanup script in dry-run mode and review the exact records.
4. Execute cleanup only with explicit production approval.
5. Run the Android release workflow with tag `v1.0.1`, release name
   `RentItEase v1.0.1`, and build number `2`.
6. Verify the GitHub release notes name the merge commit.
7. Download again through the website and repeat the failed device cases.
