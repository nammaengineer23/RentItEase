import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/authentication/presentation/pages/authentication_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',

    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashPage(),
      ),

      GoRoute(
        path: '/auth',
        builder: (context, state) =>
            const AuthenticationPage(),
      ),

      GoRoute(
        path: '/home',
        builder: (context, state) =>
            const HomePage(),
      ),
    ],

    errorBuilder: (context, state) {
      return Scaffold(
        body: Center(
          child: Text(
            state.error.toString(),
          ),
        ),
      );
    },
  );
}