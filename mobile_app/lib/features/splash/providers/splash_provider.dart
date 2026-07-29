import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/splash_service.dart';

/// Splash Service Provider
final splashServiceProvider = Provider<SplashService>((ref) {
  return SplashService();
});

/// Determines where the app should navigate after splash.
///
/// Returns:
/// - SplashDestination.onboarding
/// - SplashDestination.login
/// - SplashDestination.home
final splashProvider = FutureProvider<SplashDestination>((ref) async {
  final splashService = ref.read(splashServiceProvider);

  return splashService.determineDestination();
});
