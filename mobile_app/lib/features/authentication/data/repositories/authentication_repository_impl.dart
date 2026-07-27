import '../models/auth_response.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';
import '../../services/authentication_service.dart';

class AuthenticationRepositoryImpl {
  AuthenticationRepositoryImpl({
    AuthenticationService? service,
  }) : _service = service ?? AuthenticationService();

  final AuthenticationService _service;

  Future<AuthResponse> login(
    LoginRequest request,
  ) async {
    return _service.login(request);
  }

  Future<AuthResponse> register(
    RegisterRequest request,
  ) async {
    return _service.register(request);
  }

  Future<void> logout() async {
    await _service.logout();
  }

  Future<void> refreshToken() async {
    await _service.refreshToken();
  }

  Future<void> firebaseLogin(
    String idToken,
  ) async {
    await _service.firebaseLogin(idToken);
  }
}