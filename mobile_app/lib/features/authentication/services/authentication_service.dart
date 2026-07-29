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

  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.login,
      data: request.toJson(),
    );
    return AuthResponse.fromJson(response.data!);
  }

  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.register,
      data: request.toJson(),
    );
    return AuthResponse.fromJson(response.data!);
  }

  Future<void> logout() async {
    try {
      await _client.dio.post<void>(ApiPaths.logout);
    } finally {
      await _storage.clearTokens();
    }
  }

  Future<void> saveSession(AuthResponse response) => _storage.saveTokens(
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  );

  Future<AuthResponse?> restoreSession() async {
    var accessToken = await _storage.getString(StorageService.accessTokenKey);
    var refreshToken = await _storage.getString(StorageService.refreshTokenKey);
    if (accessToken == null || refreshToken == null) return null;

    try {
      final me = await _client.dio.get<Map<String, dynamic>>(ApiPaths.me);
      return AuthResponse(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserModel.fromJson(me.data!),
      );
    } catch (_) {
      // ApiClient may have transparently refreshed the tokens while fetching me.
      accessToken = await _storage.getString(StorageService.accessTokenKey);
      refreshToken = await _storage.getString(StorageService.refreshTokenKey);
      if (accessToken == null || refreshToken == null) rethrow;
      final me = await _client.dio.get<Map<String, dynamic>>(ApiPaths.me);
      return AuthResponse(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserModel.fromJson(me.data!),
      );
    }
  }

  Future<void> refreshToken() async {
    final refreshToken = await _storage.getString(
      StorageService.refreshTokenKey,
    );
    if (refreshToken == null) return;
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiPaths.refresh,
      data: {'refreshToken': refreshToken},
    );
    final data = response.data!;
    await _storage.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  Future<void> firebaseLogin(String idToken) async {
    await _client.dio.post<void>(
      '/auth/firebase-login',
      data: {'idToken': idToken},
    );
  }
}
