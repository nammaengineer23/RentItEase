# Firebase Configuration Audit

## Scope

Phase 1E verifies the Firebase configuration used by the RentItEase mobile client and backend authentication boundary. Secrets are not stored in source control.

## Verified repository configuration

- Firebase project: `rentitease-65e49`.
- Android application ID: `com.rentitease.app`.
- iOS bundle ID: `com.RentItEase.app.mobileApp`.
- Web Firebase app is configured in `mobile_app/lib/firebase_options.dart`.
- Firebase Admin credentials are environment variables:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- Backend verifies Firebase ID tokens with revocation checking.
- Backend verifies Firebase App Check tokens for protected authentication endpoints.
- Flutter sends `X-Firebase-AppCheck` and backend CORS permits that header.
- Android production App Check uses Play Integrity; debug uses the debug provider.
- iOS production App Check uses App Attest; debug uses the debug provider.
- Web App Check uses reCAPTCHA Enterprise.
- Release CI requires the Firebase Android `google-services.json` to be supplied through the `FIREBASE_ANDROID_GOOGLE_SERVICES_JSON` GitHub secret instead of tracking the file.

## Client configuration and secrets

Firebase client configuration values such as project ID, app ID, messaging sender ID, and API keys in `firebase_options.dart` are client configuration, not Firebase Admin credentials. They must still have appropriate API restrictions and Firebase-side authorization configured.

The following must never be committed:

- Firebase Admin private keys;
- service-account JSON credentials;
- `.env` files containing server secrets;
- Android signing keys;
- iOS signing/provisioning credentials.

## Firebase Console verification required

Repository inspection cannot prove Firebase Console state. Before production release, verify:

1. Firebase project is `rentitease-65e49`.
2. Android app package is `com.rentitease.app`.
3. iOS app bundle ID is `com.RentItEase.app.mobileApp`.
4. Web app is registered for the production domain(s).
5. App Check has registered Android, Apple, and Web apps with the intended production providers.
6. Android Play Integrity is configured for the release application.
7. Apple App Attest is configured for the production application.
8. Web reCAPTCHA Enterprise configuration uses the production site key and authorized domains.
9. Firebase Authentication providers required by RentItEase are enabled.
10. Firebase Authentication authorized domains contain only required production/development domains.
11. Google/Maps/API keys have API restrictions appropriate to the application and are not unrestricted where restrictions are available.
12. Firebase App Check metrics show valid production traffic before relying on enforcement for any Firebase product.
13. The Android release signing SHA-1/SHA-256 fingerprints are registered for the Android Firebase app.
14. The GitHub `FIREBASE_ANDROID_GOOGLE_SERVICES_JSON` secret matches the Firebase Android app configuration.

## Backend boundary

The backend does not trust client Firebase configuration by itself. Authentication uses Firebase Admin verification, and the App Check guard verifies the App Check token server-side before protected phone/Firebase authentication routes execute.

## Findings fixed during Phase 1E

- Added the App Check header to backend CORS allowed headers so browser clients can send the required proof.
- Added Apple App Check activation so iOS clients can obtain a backend-verifiable App Check token.
- Added release CI injection of `google-services.json` from a GitHub secret instead of assuming a tracked configuration file.

## Limitations

The repository cannot prove Firebase Console settings, API-key restrictions, App Check registration, Play Integrity registration, App Attest registration, authorized domains, or the live GitHub secret value. Those are release-owner verification items.
