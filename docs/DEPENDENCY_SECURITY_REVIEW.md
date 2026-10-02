# Dependency Security Review

Date: 2026-10-01
PR: #82

## Backend

- NestJS remains on the 11.x line.
- `@nestjs/swagger` is pinned at `^11.4.7`; the 11.4.7 release includes the js-yaml 5.3.0 dependency update.
- Prisma remains on 6.19.3. A forced audit downgrade is explicitly rejected.
- The Prisma transitive `deepmerge-ts` advisory (GHSA-ggr8-5vv4-36mx / CVE-2026-40345) is mitigated with an `overrides` entry for `deepmerge-ts` `^8.0.2`, without changing the Prisma major/minor line.
- Multer, Sharp, Firebase Admin, Razorpay and authentication/security packages are retained on their current major lines pending focused compatibility review.
- CI runs `npm audit --omit=dev --audit-level=high` as a blocking gate.

## Flutter

CI runs `flutter pub outdated` and `flutter analyze`. Security-sensitive packages reviewed against the current dependency inventory include Firebase Auth/Core/App Check/Messaging, secure storage, permissions, Google Maps/location, Razorpay, media/video and WebView/YouTube packages. No unreviewed major upgrade is introduced as part of this hardening PR.

## Admin

CI runs `npm audit --audit-level=high`, TypeScript lint/type checking and production build.

## Upgrade policy

Do not use `npm audit fix --force` when it proposes a downgrade or a breaking framework/toolchain change. Prefer an upstream patched release or a narrowly scoped transitive override with a documented removal condition.
