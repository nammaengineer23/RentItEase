import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/app/route_access_policy.dart';

void main() {
  group('route access policy', () {
    test('does not redirect while the persisted session is being restored', () {
      expect(
        routeAccessRedirect(
          location: '/owner/dashboard',
          isWeb: false,
          isLoggedIn: false,
          isSessionRestored: false,
        ),
        isNull,
      );
    });

    test('sends an unauthenticated visitor to authentication for private routes', () {
      expect(
        routeAccessRedirect(
          location: '/my-bookings',
          isWeb: false,
          isLoggedIn: false,
          isSessionRestored: true,
        ),
        '/auth',
      );
    });

    test('allows public landing routes without a session', () {
      expect(
        routeAccessRedirect(
          location: '/',
          isWeb: true,
          isLoggedIn: false,
          isSessionRestored: true,
        ),
        isNull,
      );
    });

    test('allows public property details on web without a session', () {
      expect(
        routeAccessRedirect(
          location: '/property/property-123',
          isWeb: true,
          isLoggedIn: false,
          isSessionRestored: true,
        ),
        isNull,
      );
    });

    test('tenant cannot open owner pages', () {
      expect(
        routeAccessRedirect(
          location: '/owner/properties',
          isWeb: false,
          isLoggedIn: true,
          isSessionRestored: true,
          role: 'USER',
        ),
        '/home',
      );
    });

    test('owner cannot open tenant-only visit history', () {
      expect(
        routeAccessRedirect(
          location: '/my-visits',
          isWeb: false,
          isLoggedIn: true,
          isSessionRestored: true,
          role: 'OWNER',
        ),
        '/home',
      );
    });

    test('tenant cannot open the admin console', () {
      expect(
        routeAccessRedirect(
          location: '/admin/dashboard',
          isWeb: false,
          isLoggedIn: true,
          isSessionRestored: true,
          role: 'USER',
        ),
        '/home',
      );
    });

    test('admin is directed to the admin console from tenant pages', () {
      expect(
        routeAccessRedirect(
          location: '/marketplace',
          isWeb: false,
          isLoggedIn: true,
          isSessionRestored: true,
          role: 'ADMIN',
        ),
        '/admin/dashboard',
      );
    });

    test('admin can still open profile and settings', () {
      for (final location in ['/profile', '/profile/edit', '/settings']) {
        expect(
          routeAccessRedirect(
            location: location,
            isWeb: false,
            isLoggedIn: true,
            isSessionRestored: true,
            role: 'ADMIN',
          ),
          isNull,
          reason: '$location should be available to admins',
        );
      }
    });

    test('owner can open owner dashboard', () {
      expect(
        routeAccessRedirect(
          location: '/owner/dashboard',
          isWeb: false,
          isLoggedIn: true,
          isSessionRestored: true,
          role: 'OWNER',
        ),
        isNull,
      );
    });

    test('web auth history returns each role to its home', () {
      final cases = <String, String>{
        'ADMIN': '/admin/dashboard',
        'OWNER': '/owner/dashboard',
        'USER': '/home',
      };

      for (final entry in cases.entries) {
        expect(
          routeAccessRedirect(
            location: '/sign-in',
            isWeb: true,
            isLoggedIn: true,
            isSessionRestored: true,
            role: entry.key,
          ),
          entry.value,
        );
      }
    });
  });
}
