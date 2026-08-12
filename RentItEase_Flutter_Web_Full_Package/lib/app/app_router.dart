import 'package:go_router/go_router.dart';

import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/dashboard/presentation/dashboard_page.dart';
import '../features/properties/presentation/properties_page.dart';
import '../features/properties/presentation/property_details_page.dart';
import '../features/favorites/presentation/favorites_page.dart';
import '../features/visits/presentation/visits_page.dart';
import '../features/profile/presentation/profile_page.dart';
import '../features/owner/presentation/owner_dashboard_page.dart';
import '../features/payments/presentation/payments_page.dart';
import '../shared/presentation/not_found_page.dart';
import '../shared/widgets/app_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/dashboard',
  routes: [
    GoRoute(
      path: '/login',
      builder: (_, __) => const LoginPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (_, __) => const RegisterPage(),
    ),
    ShellRoute(
      builder: (_, state, child) => AppShell(
        location: state.uri.path,
        child: child,
      ),
      routes: [
        GoRoute(
          path: '/dashboard',
          builder: (_, __) => const DashboardPage(),
        ),
        GoRoute(
          path: '/properties',
          builder: (_, __) => const PropertiesPage(),
        ),
        GoRoute(
          path: '/properties/:id',
          builder: (_, state) => PropertyDetailsPage(
            propertyId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/favorites',
          builder: (_, __) => const FavoritesPage(),
        ),
        GoRoute(
          path: '/visits',
          builder: (_, __) => const VisitsPage(),
        ),
        GoRoute(
          path: '/profile',
          builder: (_, __) => const ProfilePage(),
        ),
        GoRoute(
          path: '/owner',
          builder: (_, __) => const OwnerDashboardPage(),
        ),
        GoRoute(
          path: '/payments',
          builder: (_, __) => const PaymentsPage(),
        ),
      ],
    ),
  ],
  errorBuilder: (_, __) => const NotFoundPage(),
);
