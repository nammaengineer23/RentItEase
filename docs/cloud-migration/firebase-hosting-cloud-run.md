# RentItEase Firebase Hosting + Cloud Run migration

## Target architecture

- Flutter Web static build: Firebase Hosting.
- NestJS REST API: Google Cloud Run, built from `backend/Dockerfile`.
- PostgreSQL: retain the existing Neon database; do not move or recreate it as part of this hosting migration.
- Authentication and object storage: retain the existing Firebase Auth and Firebase Storage integrations.
- DNS: move the web custom domain to Firebase Hosting and route the existing API hostname to Cloud Run using a supported HTTPS front door (Cloud Run domain mapping where available, otherwise an external Application Load Balancer/serverless NEG).

The Android app currently defaults to `https://api.rentitease.com/api/v1`. Preserve that hostname during migration. Do not change the default mobile API URL unless a separately reviewed compatibility plan is approved.

## Safety properties

- Both deployment workflows are manual (`workflow_dispatch`); no deploy is triggered by a push or PR.
- The selected GitHub Environment must provide the environment-specific project/service configuration.
- Cloud Run container startup runs `node dist/main.js` directly. It does **not** run Prisma migrations.
- Do not attach the production Neon database to staging.
- Do not copy production secrets, user data, Firebase objects, or database records into staging.
- Keep Railway and the existing production DNS records unchanged until staging acceptance and a production cutover plan are approved.

## One-time Google Cloud setup per environment

1. Create/choose a Google Cloud project and enable Cloud Run, Cloud Build, Artifact Registry, IAM Credentials and Secret Manager APIs.
2. Create an Artifact Registry Docker repository in the selected Cloud Run region.
3. Configure Workload Identity Federation for this GitHub repository and grant the deployment service account only the required build, Artifact Registry and Cloud Run deployment permissions. Do not store a long-lived service-account JSON key in GitHub.
4. Create a Cloud Run runtime service account. Grant it only the access needed by the application, including Secret Manager secret accessor on the specific secrets it consumes.
5. Create the Cloud Run service with the required application environment variables and Secret Manager bindings before its first workflow deployment. Use a dedicated isolated staging Neon database and staging Firebase project for staging.
6. Configure the Cloud Run service to listen on the injected `PORT` (the application already does this) and allow public invocation; application endpoints continue to enforce Firebase/JWT authorization.
7. Verify `/api/v1/health` and database connectivity before any staging integration tests.

## GitHub Environment configuration

Create GitHub Environments named exactly `staging` and `production`. Add the following environment-scoped values:

### Secrets

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: full Workload Identity Provider resource name.
- `GCP_DEPLOY_SERVICE_ACCOUNT`: deployment service-account email.
- `GCP_PROJECT_ID`: Google Cloud project ID (Cloud Run workflow).
- `FIREBASE_PROJECT_ID`: Firebase project ID (Hosting workflow).

### Variables

- `CLOUD_RUN_REGION`: Cloud Run and Artifact Registry region, e.g. `asia-south1`.
- `CLOUD_RUN_SERVICE`: environment-specific Cloud Run service name.
- `ARTIFACT_REGISTRY_REPOSITORY`: existing Artifact Registry repository name.
- `API_BASE_URL`: full environment-specific API base URL ending in `/api/v1`; staging must use its Cloud Run staging URL or staging API hostname, production must preserve `https://api.rentitease.com/api/v1`.

Set required reviewers on the production GitHub Environment so a production workflow run cannot deploy without approval.

## Firebase Hosting setup

1. Enable Firebase Hosting in each environment's Firebase project.
2. Attach `rentitease.com` and `www.rentitease.com` to the production Hosting site. Keep the existing Cloudflare DNS records until Firebase verifies domain ownership and provides the exact records to apply.
3. Use the staging project's default Hosting domain for staging acceptance.
4. The root `firebase.json` serves `mobile_app/build/web`, disables caching for the Flutter entry point/service worker/version file, and falls back to `index.html` for Flutter routes.
5. Do not remove Cloudflare DNS/proxy configuration or disable the current web deployment until the Firebase-hosted site passes acceptance and the DNS cutover is approved.

## API hostname and cutover

The API hostname must continue to resolve to the Cloud Run service over HTTPS. Prefer a Cloud Run custom domain mapping if it is supported for the selected project/region and meets the required TLS behavior. Otherwise use an external HTTPS Application Load Balancer with a serverless NEG targeting Cloud Run. Do not point `api.rentitease.com` at the Flutter Hosting site: its SPA fallback is for the web application, not the API.

The backend currently enforces the production host allowlist and HTTPS behavior in `backend/src/main.ts`. Configure `ALLOWED_HOSTS=api.rentitease.com`, `TRUST_PROXY=true`, and the exact production CORS origins when provisioning the production service. Staging must have its own host allowlist and CORS origins; do not broaden production CORS to arbitrary origins.

## Staging acceptance checklist

- [ ] Staging Cloud Run service starts and reports the expected staging environment.
- [ ] Staging API health endpoint succeeds.
- [ ] Staging service connects only to the isolated staging Neon database.
- [ ] Firebase ID-token login and protected API requests work.
- [ ] Firebase Storage upload, read, authorization and deletion tests pass using staging objects only.
- [ ] Property image/video and private chat attachment authorization tests pass.
- [ ] Flutter Web staging site loads, deep links work, and API requests target staging.
- [ ] Android test build can reach the staging API without changing the production default.
- [ ] Logs, error reporting, Cloud Run scaling and Secret Manager access are verified.

## Database migrations

Do not use the container startup command or deployment workflow to run Prisma migrations. Migration execution is a separate controlled operation using a dedicated migration identity and an explicitly selected isolated database. Validate the migration against staging first, review the SQL and backup/restore plan, and obtain explicit approval before any production migration.

## Production cutover and rollback

Production cutover is a separate approval. Before changing DNS, confirm staging acceptance, configure production secrets and service identity, verify the production Neon connection without running migrations, and confirm the API hostname/TLS routing. Deploy the API first, verify it through its final hostname, deploy Flutter Web, then change only the DNS records Firebase instructs you to change. Keep the previous Cloudflare/Railway configuration available for rollback until the new deployment has been stable and accepted.
