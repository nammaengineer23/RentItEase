import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/auth_response.dart';
import '../data/models/login_request.dart';
import '../data/models/register_request.dart';
import '../data/repositories/authentication_repository_impl.dart';

final authenticationProvider = ChangeNotifierProvider<AuthenticationProvider>((
  ref,
) {
  return AuthenticationProvider();
});

class AuthenticationProvider extends ChangeNotifier {
  AuthenticationProvider({AuthenticationRepositoryImpl? repository})
    : _repository = repository ?? AuthenticationRepositoryImpl();

  final AuthenticationRepositoryImpl _repository;

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberMe = false;

  String? _errorMessage;
  AuthResponse? _authResponse;

  bool get isLoading => _isLoading;

  bool get obscurePassword => _obscurePassword;

  bool get rememberMe => _rememberMe;

  String? get errorMessage => _errorMessage;

  AuthResponse? get authResponse => _authResponse;

  bool get isLoggedIn => _authResponse != null;

  void togglePasswordVisibility() {
    _obscurePassword = !_obscurePassword;
    notifyListeners();
  }

  void setRememberMe(bool value) {
    _rememberMe = value;
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) async {
    _setLoading(true);

    try {
      _errorMessage = null;

      final response = await _repository.login(
        LoginRequest(email: email, password: password),
      );

      _authResponse = response;

      await _saveSession(response);

      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString();

      _setLoading(false);
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
  }) async {
    _setLoading(true);

    try {
      _errorMessage = null;

      final response = await _repository.register(
        RegisterRequest(
          fullName: fullName,
          email: email,
          phone: phone,
          password: password,
        ),
      );

      _authResponse = response;

      await _saveSession(response);

      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString();

      _setLoading(false);
      return false;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    _authResponse = null;

    notifyListeners();
  }

  Future<void> loadSavedSession() async {
    try {
      _authResponse = await _repository.restoreSession();
    } catch (_) {
      _authResponse = null;
    }
    notifyListeners();
  }

  Future<void> _saveSession(AuthResponse response) async {
    await _repository.saveSession(response);
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
