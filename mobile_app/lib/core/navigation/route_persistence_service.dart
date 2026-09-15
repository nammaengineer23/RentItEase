import 'package:shared_preferences/shared_preferences.dart';

class RoutePersistenceService {
  RoutePersistenceService._();

  static const _lastRouteKey = 'last_authenticated_route';

  static const _excludedPrefixes = <String>[
    '/splash',
    '/onboarding',
    '/auth',
    '/sign-in',
    '/register',
    '/forgot-password',
    '/book-visit',
    '/payment',
    '/lease/create',
    '/owner/property/add',
    '/owner/property/edit',
    '/owner/property/upload',
  ];

  static bool canPersist(String route) {
    if (route.isEmpty || route == '/') return false;
    return !_excludedPrefixes.any(
      (prefix) => route == prefix || route.startsWith('$prefix/'),
    );
  }

  static Future<void> save(String route) async {
    if (!canPersist(route)) return;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_lastRouteKey, route);
  }

  static Future<String?> loadForRole(String? role) async {
    final preferences = await SharedPreferences.getInstance();
    final route = preferences.getString(_lastRouteKey);
    if (route == null || !canPersist(route)) return null;

    final normalizedRole = role?.trim().toUpperCase();
    if (route.startsWith('/admin/') && normalizedRole != 'ADMIN') return null;
    if (route.startsWith('/owner/') && normalizedRole != 'OWNER') return null;
    if (normalizedRole == 'ADMIN' &&
        !route.startsWith('/admin/') &&
        !route.startsWith('/profile') &&
        !route.startsWith('/settings')) {
      return null;
    }

    return route;
  }

  static Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_lastRouteKey);
  }
}
