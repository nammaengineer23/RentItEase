class Environment {
  static const String appName = 'RentItEase';

  /// Override with `--dart-define=API_BASE_URL=https://your-host/api/v1`.
  /// The Android emulator reaches a backend on the development machine through
  /// 10.0.2.2; physical devices and release builds must supply their API URL.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://RentItEase-production-4d16.up.railway.app/api/v1',
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
