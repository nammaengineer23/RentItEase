# RentItEase Architecture

## Runtime components
- Backend: NestJS REST API, Prisma ORM, PostgreSQL.
- Mobile: Flutter/Riverpod client for Android, iOS and web.
- Admin: React/Vite web application under `/admin-panel/`.
- Storage: Firebase Storage or Cloudflare R2.
- Payments: Razorpay; secrets remain backend-only.
- Auth: RentItEase JWT access/refresh sessions plus Firebase-backed social/phone flows where enabled.
- Notifications: durable in-app notification records, device tokens and FCM delivery queue.
- AI: server-side OpenAI listing generation.
- Social media: consent → generation → review → scheduled publishing; encrypted provider credentials.

## Backend boundaries
`src/modules` contains domain modules. Cross-cutting security lives in guards, validation, interceptors, exception filters and rate limiting. Prisma is the persistence boundary.

## Request flow
1. HTTPS/CORS/Helmet/body limits.
2. Request correlation ID.
3. JWT/role authorization where protected.
4. DTO validation with whitelist + forbidNonWhitelisted.
5. Domain service.
6. Prisma transaction where state must change atomically.
7. Structured logging without secrets.
8. Standard error envelope.

## Deployment
Production web deployment builds Flutter web and the React admin bundle, then deploys through Cloudflare. Backend production deployment applies Prisma migrations before starting the application.

## Security boundaries
- Secrets are supplied through environment/secret-manager configuration.
- Client bundles receive only public configuration such as API base URLs and public Firebase/Maps configuration.
- Payment amounts and signatures are verified server-side.
- Uploads are authenticated, type/size checked and stored through controlled storage adapters.
- Social provider credentials are encrypted at rest.
