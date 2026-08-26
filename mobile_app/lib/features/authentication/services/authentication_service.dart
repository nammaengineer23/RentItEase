import '../../../config/environment.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/storage_service.dart';
import '../data/models/auth_response.dart';
import '../data/models/login_request.dart';
import '../data/models/register_request.dart';

class AuthenticationService {
  AuthenticationService({
    ApiClient? client,
    StorageService? storage,
  }) : _client = client ?? ApiClient.shared,
       _storage = storage ?? StorageService();

  final ApiClient _client;
  final StorageService _storage;

  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.login,
      data: request.toJson(),
    );

    return AuthResponse.fromJson(_extractData(response.data));
  }

  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.register,
      data: request.toJson(),
    );

    return AuthResponse.fromJson(_extractData(response.data));
  }

  Future<void> logout() async {
    try {
      await _client.dio.post<void>(ApiPaths.logout);
    } finally {
      await _storage.clearTokens();
    }
  }

  Future<void> saveSession(AuthResponse response) {
    return _storage.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );
  }

  Future<AuthResponse?> restoreSession() async {
    var accessToken = await _storage.getString(StorageService.accessTokenKey);
    var refreshToken = await _storage.getString(StorageService.refreshTokenKey);

    if (accessToken == null || refreshToken == null) {
      return null;
    }

    try {
      final me = await _client.dio.get<Map<String, dynamic>>(ApiPaths.me);

      return AuthResponse(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserModel.fromJson(_extractData(me.data)),
      );
    } catch (_) {
      accessToken = await _storage.getString(StorageService.accessTokenKey);
      refreshToken = await _storage.getString(StorageService.refreshTokenKey);

      if (accessToken == null || refreshToken == null) {
        rethrow;
      }

      final me = await _client.dio.get<Map<String, dynamic>>(ApiPaths.me);

      return AuthResponse(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserModel.fromJson(_extractData(me.data)),
      );
    }
  }

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

    if (accessToken == null || nextRefreshToken == null) {
      throw Exception('Invalid refresh response: missing tokens');
    }

    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: nextRefreshToken,
    );
  }

  Future<AuthResponse> firebaseLogin(String idToken) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/auth/firebase-login',
      data: {'idToken': idToken},
    );

    final auth = AuthResponse.fromJson(_extractData(response.data));
    await saveSession(auth);
    return auth;
  }

  Map<String, dynamic> _extractData(Map<String, dynamic>? responseData) {
    if (responseData == null) {
      throw Exception('Invalid API response: missing data');
    }

    final data = responseData['data'];
    return data is Map<String, dynamic> ? data : responseData;
  }
}
