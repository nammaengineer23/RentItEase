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

  Future<void> requestSignupEmailOtp(String email) {
    return _service.requestSignupEmailOtp(email);
  }

  Future<String> verifySignupEmailOtp(String email, String otp) {
    return _service.verifySignupEmailOtp(email, otp);
  }

  Future<AuthResponse> registerVerified(
    RegisterRequest request, {
    required String emailVerificationToken,
    required String phoneIdToken,
  }) {
    return _service.registerVerified(
      request,
      emailVerificationToken: emailVerificationToken,
      phoneIdToken: phoneIdToken,
    );
  }

  Future<void> requestLoginEmailOtp(String email) {
    return _service.requestLoginEmailOtp(email);
  }

  Future<AuthResponse> loginWithEmailOtp(String email, String otp) {
    return _service.loginWithEmailOtp(email, otp);
  }

  Future<AuthResponse> loginWithPhoneOtp(String idToken) {
    return _service.loginWithPhoneOtp(idToken);
  }

  Future<void> forgotPassword(String email) {
    return _service.forgotPassword(email);
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