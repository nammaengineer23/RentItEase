import '../models/auth_response.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';
import '../../services/authentication_service.dart';

class AuthenticationRepositoryImpl {
  AuthenticationRepositoryImpl({
    AuthenticationService? service,
  }) : _service = service ?? AuthenticationService();

  final AuthenticationService _service;

  Future<AuthResponse> login(LoginRequest request) {
    return _service.login(request);
  }

  Future<AuthResponse> register(RegisterRequest request) {
    return _service.register(request);
  }

  Future<void> logout() {
    return _service.logout();
  }

  Future<void> refreshToken() {
    return _service.refreshToken();
  }

  Future<AuthResponse> firebaseLogin(String idToken) {
    return _service.firebaseLogin(idToken);
  }

  Future<AuthResponse?> restoreSession() {
    return _service.restoreSession();
  }

  Future<void> saveSession(AuthResponse response) {
    return _service.saveSession(response);
  }
}