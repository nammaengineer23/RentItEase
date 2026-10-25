const _publicPaths = <String>{
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/delete-account',
  '/splash',
  '/onboarding',
  '/auth',
  '/sign-in',
  '/register',
  '/forgot-password',
};

const _authenticationPaths = <String>{
  '/auth',
  '/sign-in',
  '/register',
  '/forgot-password',
};

/// Pure route-access policy shared by the router and role-guard tests.
///
/// Returns a redirect location when access must be redirected, otherwise null.
/// Session restoration is deliberately handled before role checks.
String? routeAccessRedirect({
  required String location,
  required bool isWeb,
  required bool isLoggedIn,
  required bool isSessionRestored,
  String? role,
}) {
  final normalizedRole = role?.trim().toUpperCase();
  final publicPath =
      (isWeb && location.startsWith('/property/')) ||
      _publicPaths.contains(location);

  if (!isSessionRestored) return null;

  if (!isLoggedIn && !publicPath) return '/auth';

  if (isWeb &&
      isLoggedIn &&
      _authenticationPaths.contains(location)) {
    return switch (normalizedRole) {
      'ADMIN' => '/admin/dashboard',
      'OWNER' => '/owner/dashboard',
      _ => '/home',
    };
  }

  if (location.startsWith('/admin/') && normalizedRole != 'ADMIN') {
    return isLoggedIn ? '/home' : '/auth';
  }

  if (location == '/my-visits' && normalizedRole != 'USER') {
    return normalizedRole == 'ADMIN' ? '/admin/dashboard' : '/home';
  }

  if (normalizedRole == 'ADMIN' &&
      !publicPath &&
      !location.startsWith('/admin/') &&
      !location.startsWith('/profile') &&
      !location.startsWith('/settings')) {
    return '/admin/dashboard';
  }

  if (location.startsWith('/owner/') && normalizedRole != 'OWNER') {
    return '/home';
  }

  return null;
}
