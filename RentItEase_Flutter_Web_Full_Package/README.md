# RentItEase — Complete Flutter Web Package

This package is a complete web-ready Flutter application layer, not just the `web/`
folder. It includes:

- Responsive web shell
- GoRouter navigation
- Authentication screens
- Tenant dashboard
- Owner dashboard
- Property browsing/details
- Favorites
- Property visits
- Profile
- Payments placeholder
- API client with configurable backend URL
- Responsive sidebar/navigation
- Loading/error/empty states
- Web `index.html`, manifest and icons

## IMPORTANT

This package is intentionally isolated from your existing `mobile_app/lib` so that
you can review it before replacing your current code.

The package uses your existing dependency versions from the supplied pubspec where
possible.

## Install

Copy the `lib/` and `web/` directories into your project only after backing up the
existing directories.

Then run:

    flutter clean
    flutter pub get
    flutter analyze
    flutter run -d chrome

## Backend URL

Default:

    http://localhost:3000/api/v1

For Railway, pass:

    --dart-define=API_BASE_URL=https://YOUR-RAILWAY-DOMAIN/api/v1

Example:

    flutter run -d chrome --dart-define=API_BASE_URL=https://your-api.example.com/api/v1

Production:

    flutter build web --release --dart-define=API_BASE_URL=https://your-api.example.com/api/v1

## Notes

Firebase, Google Maps and Razorpay are deliberately kept behind integration points.
Their credentials/configuration are project-specific and should not be hard-coded
into this archive.

Before release, merge the existing mobile-specific Firebase/payment/map code with
the web-safe implementations.
