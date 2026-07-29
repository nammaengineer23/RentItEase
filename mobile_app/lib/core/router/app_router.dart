import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/authentication/presentation/pages/authentication_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';

import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/profile/presentation/pages/edit_profile_page.dart';
import '../../features/profile/presentation/pages/settings_page.dart';

import '../../features/notifications/presentation/pages/notifications_page.dart';

import '../../features/search/presentation/pages/search_page.dart';
import '../../features/favorites/presentation/pages/favorites_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',

    routes: [
      // ===============================
      // Splash
      // ===============================
      GoRoute(path: '/', builder: (context, state) => const SplashPage()),

      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),

      // ===============================
      // Authentication
      // ===============================
      GoRoute(
        path: '/auth',

        builder: (context, state) => const AuthenticationPage(),
      ),

      // ===============================
      // Home
      // ===============================
      GoRoute(path: '/home', builder: (context, state) => const HomePage()),

      // ===============================
      // Profile
      // ===============================
      GoRoute(
        path: '/profile',

        name: 'profile',

        builder: (context, state) => const ProfilePage(),
      ),

      GoRoute(
        path: '/profile/edit',

        name: 'edit-profile',

        builder: (context, state) => const EditProfilePage(),
      ),

      GoRoute(
        path: '/profile/settings',

        name: 'profile-settings',

        builder: (context, state) => const SettingsPage(),
      ),

      // ===============================
      // Notifications
      // ===============================
      GoRoute(
        path: '/notifications',

        name: 'notifications',

        builder: (context, state) => const NotificationsPage(),
      ),

      // ===============================
      // Search
      // ===============================
      GoRoute(
        path: '/search',

        name: 'search',

        builder: (context, state) => const SearchPage(),
      ),

      // ===============================
      // Favorites
      // ===============================
      GoRoute(
        path: '/favorites',

        name: 'favorites',

        builder: (context, state) => const FavoritesPage(),
      ),
    ],

    errorBuilder: (context, state) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),

        body: Center(child: Text(state.error?.toString() ?? 'Page not found')),
      );
    },
  );
}
