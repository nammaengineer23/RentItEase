import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'authenticated_shell.dart';

import '../features/admin/presentation/pages/admin_dashboard_page.dart';
import '../features/authentication/presentation/pages/authentication_page.dart';
import '../features/authentication/presentation/pages/forgot_password_page.dart';
import '../features/authentication/presentation/pages/login_page.dart';
import '../features/authentication/presentation/pages/register_page.dart';
import '../features/authentication/providers/authentication_provider.dart';

import '../features/booking/presentation/pages/my_bookings_page.dart';

import '../features/chat/presentation/pages/chat_list_page.dart';
import '../features/chat/presentation/pages/chat_page.dart';

import '../features/favorites/presentation/pages/favorites_page.dart';

import '../features/home/presentation/pages/home_page.dart';

import '../features/maps/presentation/pages/map_page.dart';
import '../features/maps/presentation/pages/map_picker_page.dart';
import '../features/maps/presentation/pages/property_map_page.dart';

import '../features/notifications/presentation/pages/notifications_page.dart';

import '../features/onboarding/presentation/pages/onboarding_page.dart';

import '../features/owner/data/models/owner_property_model.dart';
import '../features/owner/presentation/pages/add_property_page.dart';
import '../features/owner/presentation/pages/edit_property_page.dart';
import '../features/owner/presentation/pages/my_properties_page.dart';
import '../features/owner/presentation/pages/owner_analytics_page.dart';
import '../features/owner/presentation/pages/owner_dashboard_page.dart';
import '../features/owner/presentation/pages/owner_visits_page.dart';
import '../features/owner/presentation/pages/property_details_page.dart';

import '../features/payment/presentation/pages/payment_page.dart';

import '../features/profile/presentation/pages/edit_profile_page.dart';
import '../features/profile/presentation/pages/profile_page.dart';

import '../features/property/domain/entities/property_entity.dart';
import '../features/property/presentation/pages/property_details_page.dart';
import '../features/property/presentation/pages/property_listing_page.dart';
import '../features/property/presentation/pages/property_page.dart';

import '../features/property_visits/presentation/pages/book_visit_page.dart';
import '../features/property_visits/presentation/pages/my_visits_page.dart';
import '../features/property_visits/presentation/pages/owner_visit_requests_page.dart';

import '../features/reviews/presentation/pages/reviews_page.dart';

import '../features/search/presentation/pages/search_page.dart';

import '../features/settings/presentation/pages/settings_page.dart';

import '../features/splash/presentation/pages/splash_page.dart';

import '../features/uploads/presentation/pages/upload_images_page.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,

    // ============================================================
    // Global route protection
    // ============================================================
    redirect: (context, state) {
      final container = ProviderScope.containerOf(
        context,
        listen: false,
      );

      final auth = container.read(authenticationProvider);

      final location = state.matchedLocation;
      final role = auth.authResponse?.user.role.trim().toUpperCase();
      final publicPath = const {
        '/splash',
        '/onboarding',
        '/auth',
        '/sign-in',
        '/register',
        '/forgot-password',
      }.contains(location);

      if (location.startsWith('/admin/') && role != 'ADMIN') {
        return auth.isLoggedIn ? '/home' : '/auth';
      }

      if (role == 'ADMIN' &&
          !publicPath &&
          !location.startsWith('/admin/') &&
          !location.startsWith('/profile') &&
          !location.startsWith('/settings')) {
        return '/admin/dashboard';
      }

      // ----------------------------------------------------------
      // OWNER-only routes
      //
      // USER / tenant accounts must not access any /owner/*
      // screen even by manually entering the URL.
      // ----------------------------------------------------------
      if (location.startsWith('/owner/')) {
        if (role != 'OWNER') {
          return '/home';
        }
      }

      return null;
    },

    routes: [
      ShellRoute(
        builder: (context, state, child) => AuthenticatedShell(
          location: state.uri.path,
          child: child,
        ),
        routes: [
      // ============================================================
      // Splash
      // ============================================================
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),

      // ============================================================
      // Onboarding
      // ============================================================
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),

      // ============================================================
      // Authentication
      // ============================================================
      GoRoute(
        path: '/auth',
        name: 'auth',
        builder: (context, state) => const AuthenticationPage(),
      ),

      GoRoute(
        path: '/sign-in',
        name: 'sign-in',
        builder: (context, state) => LoginPage(
          onRegister: () {
            context.go('/register');
          },
        ),
      ),

      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => RegisterPage(
          onLogin: () {
            context.go('/sign-in');
          },
        ),
      ),

      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),

      // ============================================================
      // Mobile Admin Console
      // ============================================================
      GoRoute(
        path: '/admin/dashboard',
        name: 'admin-dashboard',
        builder: (context, state) => const AdminDashboardPage(),
      ),

      // ============================================================
      // Home
      // ============================================================
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomePage(),
      ),

      // ============================================================
      // Properties
      // ============================================================
      GoRoute(
        path: '/property',
        name: 'property-list',
        builder: (context, state) => const PropertyPage(),
      ),

      GoRoute(
        path: '/property-listing',
        name: 'property-listing',
        builder: (context, state) => const PropertyListingPage(),
      ),

      GoRoute(
        path: '/property/:id',
        name: 'property-details',
        builder: (context, state) {
          final propertyId = state.pathParameters['id'];

          if (propertyId == null || propertyId.isEmpty) {
            return const _RouteErrorPage(
              message: 'Property ID is missing.',
            );
          }

          return PropertyDetailsPage(
            propertyId: propertyId,
          );
        },
      ),

      // Compatibility route.
      //
      // context.push(
      //   '/property-details',
      //   extra: property,
      // );
      GoRoute(
        path: '/property-details',
        name: 'property-details-extra',
        builder: (context, state) {
          final property = state.extra;

          if (property is! PropertyEntity) {
            return const _RouteErrorPage(
              message: 'Property not found.',
            );
          }

          return PropertyDetailsPage(
            propertyId: property.id,
          );
        },
      ),

      // ============================================================
      // Search
      // ============================================================
      GoRoute(
        path: '/search',
        name: 'search',
        builder: (context, state) => SearchPage(
          openFilters: state.uri.queryParameters['filters'] == '1',
        ),
      ),

      // ============================================================
      // Favorites
      // ============================================================
      GoRoute(
        path: '/favorites',
        name: 'favorites',
        builder: (context, state) => const FavoritesPage(),
      ),

      // ============================================================
      // Chat
      // ============================================================
      GoRoute(
        path: '/chat',
        name: 'chat',
        builder: (context, state) {
          final conversationId =
              state.uri.queryParameters['conversationId'];
          final propertyId = state.uri.queryParameters['propertyId'];
          final userName =
              state.uri.queryParameters['userName'] ?? 'Owner';

          final propertyTitle =
              state.uri.queryParameters['propertyTitle'];

          final propertyImage =
              state.uri.queryParameters['propertyImage'];

          return ChatPage(
            conversationId: conversationId,
            propertyId: propertyId,
            userName: userName,
            propertyTitle: propertyTitle,
            propertyImage: propertyImage,
          );
        },
      ),

      GoRoute(
        path: '/chat-list',
        name: 'chat-list',
        builder: (context, state) => const ChatListPage(),
      ),

      // ============================================================
      // Book Property Visit
      // ============================================================
      GoRoute(
        path: '/book-visit/:propertyId',
        name: 'book-visit',
        builder: (context, state) {
          final propertyId =
              state.pathParameters['propertyId'] ?? '';

          final extra = state.extra;

          String propertyTitle = '';
          String propertyImage = '';
          String ownerName = '';

          if (extra is Map<String, dynamic>) {
            propertyTitle =
                extra['propertyTitle']?.toString() ?? '';

            propertyImage =
                extra['propertyImage']?.toString() ?? '';

            ownerName =
                extra['ownerName']?.toString() ?? '';
          }

          return BookVisitPage(
            propertyId: propertyId,
            propertyTitle: propertyTitle,
            propertyImage: propertyImage,
            ownerName: ownerName,
          );
        },
      ),

      // ============================================================
      // Bookings
      //
      // IMPORTANT:
      // The valid route is /my-bookings.
      // Do not use /bookings.
      // ============================================================
      GoRoute(
        path: '/my-bookings',
        name: 'my-bookings',
        builder: (context, state) => const MyBookingsPage(),
      ),

      // ============================================================
      // Payment
      // ============================================================
      GoRoute(
        path: '/payment/:bookingId',
        name: 'payment',
        builder: (context, state) {
          final bookingId =
              state.pathParameters['bookingId'];

          if (bookingId == null || bookingId.isEmpty) {
            return const _RouteErrorPage(
              message: 'Booking ID is missing.',
            );
          }

          return PaymentPage(
            bookingId: bookingId,
          );
        },
      ),

      // ============================================================
      // Tenant Property Visits
      // ============================================================
      GoRoute(
        path: '/my-visits',
        name: 'my-visits',
        builder: (context, state) => const MyVisitsPage(),
      ),

      // ============================================================
      // Owner Visits
      // Automatically protected by /owner/* redirect.
      // ============================================================
      GoRoute(
        path: '/owner/visits',
        name: 'owner-visits',
        builder: (context, state) => const OwnerVisitsPage(),
      ),

      GoRoute(
        path: '/owner/visit-requests',
        name: 'owner-visit-requests',
        builder: (context, state) =>
            const OwnerVisitRequestsPage(),
      ),

      // ============================================================
      // Notifications
      // ============================================================
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) =>
            const NotificationsPage(),
      ),

      // ============================================================
      // Reviews
      // ============================================================
      GoRoute(
        path: '/reviews/:propertyId',
        name: 'reviews',
        builder: (context, state) {
          final propertyId =
              state.pathParameters['propertyId'];

          if (propertyId == null || propertyId.isEmpty) {
            return const _RouteErrorPage(
              message: 'Property ID is missing.',
            );
          }

          return ReviewsPage(
            propertyId: propertyId,
          );
        },
      ),

      // ============================================================
      // Profile
      // ============================================================
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) =>
            const ProfilePage(),
      ),

      GoRoute(
        path: '/profile/edit',
        name: 'edit-profile',
        builder: (context, state) =>
            const EditProfilePage(),
      ),

      GoRoute(
        path: '/profile/settings',
        name: 'profile-settings',
        builder: (context, state) =>
            const SettingsPage(),
      ),

      // Compatibility route.
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) =>
            const SettingsPage(),
      ),

      // ============================================================
      // OWNER-ONLY ROUTES
      //
      // All routes beginning with /owner/ are protected by the
      // global redirect above.
      // ============================================================

      // Owner Dashboard
      GoRoute(
        path: '/owner/dashboard',
        name: 'owner-dashboard',
        builder: (context, state) =>
            const OwnerDashboardPage(),
      ),

      // Owner Properties
      GoRoute(
        path: '/owner/properties',
        name: 'owner-properties',
        builder: (context, state) =>
            const MyPropertiesPage(),
      ),

      // Add Property
      GoRoute(
        path: '/owner/add-property',
        name: 'owner-add-property',
        builder: (context, state) =>
            const AddPropertyPage(),
      ),

      // Owner Analytics
      GoRoute(
        path: '/owner/analytics',
        name: 'owner-analytics',
        builder: (context, state) =>
            const OwnerAnalyticsPage(),
      ),

      // ============================================================
      // Owner Property Details
      //
      // Usage:
      //
      // context.push(
      //   '/owner/property-details',
      //   extra: property,
      // );
      // ============================================================
      GoRoute(
        path: '/owner/property-details',
        name: 'owner-property-details',
        builder: (context, state) {
          final property = state.extra;

          if (property is! OwnerPropertyModel) {
            return const _RouteErrorPage(
              message: 'Owner property not found.',
            );
          }

          return OwnerPropertyDetailsPage(
            property: property,
          );
        },
      ),

      // ============================================================
      // Owner Edit Property
      //
      // Usage:
      //
      // context.push(
      //   '/owner/edit-property',
      //   extra: property,
      // );
      // ============================================================
      GoRoute(
        path: '/owner/edit-property',
        name: 'owner-edit-property',
        builder: (context, state) {
          final property = state.extra;

          if (property is! OwnerPropertyModel) {
            return const _RouteErrorPage(
              message: 'Owner property not found.',
            );
          }

          return EditPropertyPage(
            property: property,
          );
        },
      ),

      // ============================================================
      // Maps
      // ============================================================
      GoRoute(
        path: '/map',
        name: 'map',
        builder: (context, state) =>
            const MapPage(),
      ),

      GoRoute(
        path: '/map-picker',
        name: 'map-picker',
        builder: (context, state) =>
            const MapPickerPage(),
      ),

      GoRoute(
        path: '/property-map',
        name: 'property-map',
        builder: (context, state) =>
            const PropertyMapPage(),
      ),

      // ============================================================
      // Upload Images
      // ============================================================
      GoRoute(
        path: '/upload-images',
        name: 'upload-images',
        builder: (context, state) =>
            const UploadImagesPage(),
      ),
        ],
      ),
    ],

    // ============================================================
    // Global Route Error
    // ============================================================
    errorBuilder: (context, state) {
      return _RouteErrorPage(
        message:
            state.error?.toString() ??
            'No route defined for ${state.uri}',
      );
    },
  );
}

// ================================================================
// Route Error Page
// ================================================================

class _RouteErrorPage extends StatelessWidget {
  const _RouteErrorPage({
    required this.message,
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Page Not Found'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
              ),

              const SizedBox(height: 16),

              Text(
                message,
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: () {
                  context.go('/home');
                },
                child: const Text('Go to Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
