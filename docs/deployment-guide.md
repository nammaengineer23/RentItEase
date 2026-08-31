# RentItEase Deployment Guide

## Production services

- Web: Cloudflare Worker serving the Flutter web build.
- API: Railway at `https://api.rentitease.com/api/v1`.
- Database: production PostgreSQL configured through `DATABASE_URL`.
- Authentication: Firebase.
- Maps: Google Maps SDK for Android and Places API.
- Payments: Razorpay.

## Required production configuration

Set secrets only in the hosting provider or CI secret store. Required values include database, JWT, Firebase Admin, Firebase web/mobile configuration, Razorpay, Maps, and `OPENAI_API_KEY` where AI suggestions are enabled.

## Deployment sequence

1. Merge the reviewed change to `main`.
2. Confirm Backend CI and RC1 succeed.
3. Confirm the automatic web deployment succeeds.
4. Verify `/api/v1/health`, the public pages, tenant login, owner login, and one protected admin route.
5. Install the generated APK on a physical Android device before release.

## Domains

Use `rentitease.com` for public pages and `api.rentitease.com` for API calls. Firebase OAuth branding must use public URLs and authorize `rentitease.com`.
