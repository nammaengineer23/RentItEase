import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
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
  bool _googleSignInInitialized = false;

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

  Future<bool> forgotPassword(String email) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      await _repository.forgotPassword(email.trim().toLowerCase());
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> requestSignupEmailOtp(String email) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      await _repository.requestSignupEmailOtp(email);
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<String?> verifySignupEmailOtp(String email, String otp) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      return await _repository.verifySignupEmailOtp(email, otp);
    } catch (error) {
      _errorMessage = error.toString();
      return null;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> registerVerified({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required String emailVerificationToken,
    required String phoneIdToken,
  }) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      final response = await _repository.registerVerified(
        RegisterRequest(
          fullName: fullName,
          email: email,
          phone: phone,
          password: password,
        ),
        emailVerificationToken: emailVerificationToken,
        phoneIdToken: phoneIdToken,
      );
      _authResponse = response;
      await _saveSession(response);
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> requestLoginEmailOtp(String email) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      await _repository.requestLoginEmailOtp(email);
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> loginWithEmailOtp(String email, String otp) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      final response = await _repository.loginWithEmailOtp(email, otp);
      _authResponse = response;
      await _saveSession(response);
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> loginWithPhoneOtp(String idToken) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      final response = await _repository.loginWithPhoneOtp(idToken);
      _authResponse = response;
      await _saveSession(response);
      return true;
    } catch (error) {
      _errorMessage = error.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> signInWithGoogle() async {
    _setLoading(true);

    try {
      _errorMessage = null;

      if (!_googleSignInInitialized) {
        await GoogleSignIn.instance.initialize();
        _googleSignInInitialized = true;
      }

      final googleAccount = await GoogleSignIn.instance.authenticate();
      final googleAuthentication = googleAccount.authentication;
      final googleIdToken = googleAuthentication.idToken;

      if (googleIdToken == null || googleIdToken.isEmpty) {
        throw Exception('Google did not return an ID token.');
      }

      final credential = GoogleAuthProvider.credential(
        idToken: googleIdToken,
      );
      final firebaseCredential = await FirebaseAuth.instance
          .signInWithCredential(credential);
      final firebaseIdToken = await firebaseCredential.user?.getIdToken(true);

      if (firebaseIdToken == null || firebaseIdToken.isEmpty) {
        throw Exception('Firebase did not return an ID token.');
      }

      final response = await _repository.firebaseLogin(firebaseIdToken);
      _authResponse = response;
      await _saveSession(response);

      return true;
    } catch (error) {
      _errorMessage = _googleErrorMessage(error);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  String _googleErrorMessage(Object error) {
    final message = error.toString();

    if (message.toLowerCase().contains('canceled') ||
        message.toLowerCase().contains('cancelled')) {
      return 'Google sign-in was cancelled.';
    }

    return 'Google sign-in failed: $message';
  }

  Future<void> logout() async {
  _errorMessage = null;

  try {
    await _repository.logout();
  } finally {
    // Always clear local authentication state.
    //
    // AuthenticationService.logout() also clears:
    // accessToken
    // refreshToken
    //
    // even when the backend request fails.
    _authResponse = null;
    _isLoading = false;

    notifyListeners();
  }
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
