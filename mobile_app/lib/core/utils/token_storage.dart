import '../services/storage_service.dart';

class TokenStorage {
  TokenStorage._();

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static final StorageService _storage = StorageService();

  // ==========================================
  // Save Access Token
  // ==========================================

  static Future<void> saveToken(String token) async {
    await _storage.setString(_accessTokenKey, token);
  }

  static Future<void> saveAccessToken(String token) async {
    await _storage.setString(_accessTokenKey, token);
  }

  // ==========================================
  // Save Refresh Token
  // ==========================================

  static Future<void> saveRefreshToken(String token) async {
    await _storage.setString(_refreshTokenKey, token);
  }

  // ==========================================
  // Get Access Token
  // ==========================================

  static Future<String?> getToken() async {
    return _storage.getString(_accessTokenKey);
  }

  static Future<String?> getAccessToken() async {
    return _storage.getString(_accessTokenKey);
  }

  // ==========================================
  // Get Refresh Token
  // ==========================================

  static Future<String?> getRefreshToken() async {
    return _storage.getString(_refreshTokenKey);
  }

  // ==========================================
  // Has Access Token
  // ==========================================

  static Future<bool> hasToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // ==========================================
  // Clear Access Token
  // ==========================================

  static Future<void> clearToken() async {
    await _storage.remove(_accessTokenKey);
  }

  // ==========================================
  // Clear All Tokens
  // ==========================================

  static Future<void> clearAll() async {
    await _storage.remove(_accessTokenKey);
    await _storage.remove(_refreshTokenKey);
  }
}
