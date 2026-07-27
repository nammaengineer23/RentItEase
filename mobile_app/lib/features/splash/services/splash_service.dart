import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/utils/token_storage.dart';

enum SplashDestination {
  onboarding,
  login,
  home,
}

class SplashService {
  Future<SplashDestination> determineDestination() async {
    final prefs = await SharedPreferences.getInstance();

    // Has the user completed onboarding?
    final onboardingCompleted =
        prefs.getBool('onboarding_completed') ?? false;

    if (!onboardingCompleted) {
      return SplashDestination.onboarding;
    }

    // Check login token
    final accessToken = await TokenStorage.getAccessToken();

    if (accessToken != null && accessToken.isNotEmpty) {
      return SplashDestination.home;
    }

    return SplashDestination.login;
  }
}