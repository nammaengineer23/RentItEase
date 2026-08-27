import '../../../config/environment.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/storage_service.dart';
import '../data/models/auth_response.dart';
import '../data/models/login_request.dart';
import '../data/models/register_request.dart';

class AuthenticationService {
  AuthenticationService({ApiClient? client, StorageService? storage})
    : _client = client ?? ApiClient.shared,
      _storage = storage ?? StorageService();

  final ApiClient _client;
  final StorageService _storage;

  // ============================================================
  // LOGIN
  // ============================================================

  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.login,
      data: request.toJson(),
    );

    return AuthResponse.fromJson(_extractData(response.data));
  }

  Future<void> requestSignupEmailOtp(String email) async {
    await _client.dio.post<Map<String, dynamic>>(
      '/auth/register/email-otp/request',
      data: {'email': email},
    );
  }

  Future<String> verifySignupEmailOtp(String email, String otp) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/auth/register/email-otp/verify',
      data: {'email': email, 'otp': otp},
    );
    final data = _extractData(response.data);
    final token = data['verificationToken']?.toString();

    if (token == null || token.isEmpty) {
      throw Exception('Email verification proof was not returned.');
    }
    return token;
  }

  Future<AuthResponse> registerVerified(
    RegisterRequest request, {
    required String emailVerificationToken,
    required String phoneIdToken,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.register,
      data: {
        ...request.toJson(),
        'emailVerificationToken': emailVerificationToken,
        'phoneIdToken': phoneIdToken,
      },
    );

    return AuthResponse.fromJson(_extractData(response.data));
  }

  Future<void> requestLoginEmailOtp(String email) async {
    await _client.dio.post<Map<String, dynamic>>(
      '/auth/login/email-otp/request',
      data: {'email': email},
    );
  }

  Future<AuthResponse> loginWithEmailOtp(String email, String otp) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/auth/login/email-otp/verify',
      data: {'email': email, 'otp': otp},
    );
    return AuthResponse.fromJson(_extractData(response.data));
  }

  Future<AuthResponse> loginWithPhoneOtp(String idToken) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/auth/login/phone-otp',
      data: {'idToken': idToken},
    );
    return AuthResponse.fromJson(_extractData(response.data));
  }

  // ============================================================
  // REGISTER
  // ============================================================

  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.register,
      data: request.toJson(),
    );

    return AuthResponse.fromJson(_extractData(response.data));
  }

  Future<void> forgotPassword(String email) async {
    await _client.dio.post<Map<String, dynamic>>(
      '/auth/forgot-password',
      data: {'email': email},
    );
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  Future<void> logout() async {
    try {
      await _client.dio.post<void>(ApiPaths.logout);
    } finally {
      _client.clearAccessToken();
      await _storage.clearTokens();
    }
  }

  // ============================================================
  // SAVE SESSION
  // ============================================================

  Future<void> saveSession(AuthResponse response) async {
    await _storage.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );

    _client.setAccessToken(response.accessToken);
  }

  // ============================================================
  // RESTORE SESSION
  // ============================================================

  Future<AuthResponse?> restoreSession() async {
    var accessToken = await _storage.getString(StorageService.accessTokenKey);

    var refreshToken = await _storage.getString(StorageService.refreshTokenKey);

    if (accessToken == null ||
        accessToken.isEmpty ||
        refreshToken == null ||
        refreshToken.isEmpty) {
      _client.clearAccessToken();
      return null;
    }

    // The access token must be attached before /auth/me is called.
    _client.setAccessToken(accessToken);

    try {
      final me = await _client.dio.get<Map<String, dynamic>>(ApiPaths.me);

      return AuthResponse(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserModel.fromJson(_extractData(me.data)),
      );
    } catch (_) {
      // The ApiClient interceptor may have refreshed the tokens after
      // the first /auth/me request failed with an expired access token.
      accessToken = await _storage.getString(StorageService.accessTokenKey);

      refreshToken = await _storage.getString(StorageService.refreshTokenKey);

      if (accessToken == null ||
          accessToken.isEmpty ||
          refreshToken == null ||
          refreshToken.isEmpty) {
        _client.clearAccessToken();
        rethrow;
      }

      _client.setAccessToken(accessToken);

      final me = await _client.dio.get<Map<String, dynamic>>(ApiPaths.me);

      return AuthResponse(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserModel.fromJson(_extractData(me.data)),
      );
    }
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  Future<void> refreshToken() async {
    final refreshToken = await _storage.getString(
      StorageService.refreshTokenKey,
    );

    if (refreshToken == null || refreshToken.isEmpty) {
      return;
    }

    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.refresh,
      data: {'refreshToken': refreshToken},
    );

    final data = _extractData(response.data);

    final accessToken = data['accessToken'] as String?;
    final nextRefreshToken = data['refreshToken'] as String?;

    if (accessToken == null ||
        accessToken.isEmpty ||
        nextRefreshToken == null ||
        nextRefreshToken.isEmpty) {
      throw Exception('Invalid refresh response: missing tokens');
    }

    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: nextRefreshToken,
    );

    _client.setAccessToken(accessToken);
  }

  // ============================================================
  // FIREBASE LOGIN
  // ============================================================

  Future<AuthResponse> firebaseLogin(String idToken) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/auth/firebase-login',
      data: {'idToken': idToken},
    );

    final auth = AuthResponse.fromJson(_extractData(response.data));

    await saveSession(auth);

    return auth;
  }

  // ============================================================
  // RESPONSE HELPER
  // ============================================================

  Map<String, dynamic> _extractData(Map<String, dynamic>? responseData) {
    if (responseData == null) {
      throw Exception('Invalid API response: missing data');
    }

    final data = responseData['data'];

    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }

    return responseData;
  }
}
