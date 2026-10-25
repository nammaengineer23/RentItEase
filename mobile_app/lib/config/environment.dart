class Environment {
  static const String appName = 'RentItEase';

  /// Override for local development or isolated staging with
  /// `--dart-define=API_BASE_URL=https://<staging-host>/api/v1`.
  /// Never point automated mutating E2E tests at production.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.rentitease.com/api/v1',
  );
}

abstract final class ApiPaths {
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const refresh = '/auth/refresh';
  static const me = '/auth/me';
  static const logout = '/auth/logout';

  //=============================
  // Properties
  //=============================

  static const properties = '/properties';

  static const homeProperties = '/properties/home';

  static const nearbyProperties = '/properties/nearby';

  static const myProperties = '/properties/my-properties';
}
