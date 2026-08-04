# RentItEase Mobile

RentItEase is a production-ready Flutter application for discovering, booking, and managing rental properties.

## Architecture

- Clean Architecture
- Feature-first structure
- MVVM with Riverpod
- Repository pattern
- GoRouter-based navigation

## Stack

- Flutter 3.44+
- Dart 3.12+
- Riverpod
- GoRouter
- Dio
- SharedPreferences

## Installation

```bash
flutter pub get
flutter run
```

### Prerequisites

- Flutter SDK 3.12.2 or newer
- Android Studio or Xcode for device emulation
- Firebase project configured for authentication

### Firebase setup

1. Create a Firebase project and enable Authentication.
2. Enable Google Sign-In in the Authentication providers.
3. Download the platform config files and place them in the appropriate Flutter project directories.
4. Re-run the app after the configuration is synced.
