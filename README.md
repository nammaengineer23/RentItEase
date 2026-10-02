# RentItEase

RentItEase is a multi-platform property rental platform with a Flutter mobile app, backend services, an admin panel, and supporting infrastructure.

## Project structure

- mobile_app: Flutter application for tenants and property seekers
- backend: APIs and business logic
- admin_panel: administrative tooling
- database: schema and migration assets
- docs: product, API, and engineering documentation

## Mobile app setup

1. Install Flutter SDK 3.12.2 or newer.
2. Change into the mobile app directory:
   ```bash
   cd mobile_app
   ```
3. Fetch dependencies:
   ```bash
   flutter pub get
   ```
4. Run the app:
   ```bash
   flutter run
   ```

## Google Sign-In setup

The mobile app now includes Google Sign-In for Firebase authentication.

To enable it locally:

1. Create or select a Firebase project and enable Google Sign-In in the Firebase Authentication console.
2. Ensure the Android and iOS app registrations use the same package or bundle IDs configured in the project.
3. Download the Firebase configuration files and place them in the appropriate platform folders.
4. Run the app again after syncing the configuration.

If sign-in fails, verify that:

- Google Sign-In is enabled in Firebase Authentication
- the correct SHA-1/SHA-256 fingerprints are registered for Android
- the app bundle ID matches the Firebase project configuration

## Development notes

- Follow the project contribution guidelines in CONTRIBUTING.md.
- Review the architecture overview in ARCHITECTURE.md for module boundaries and conventions.
