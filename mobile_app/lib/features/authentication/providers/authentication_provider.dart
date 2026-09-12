import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../data/models/auth_response.dart';
import '../data/models/login_request.dart';
import '../data/models/register_request.dart';
import '../data/repositories/authentication_repository_impl.dart';
import '../../notifications/services/push_notification_service.dart';

final authenticationProvider = ChangeNotifierProvider<AuthenticationProvider>((
  ref,
) {
  return AuthenticationProvider();
});

class AuthenticationProvider extends ChangeNotifier {
  AuthenticationProvider({
    AuthenticationRepositoryImpl? repository,
    PushNotificationService? pushNotificationService,
  }) : _repository = repository ?? AuthenticationRepositoryImpl(),
       _pushNotificationService =
           pushNotificationService ?? PushNotificationService();

  final AuthenticationRepositoryImpl _repository;
  final PushNotificationService _pushNotificationService;

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberMe = false;

  String? _errorMessage;
  AuthResponse? _authResponse;
  bool _googleSignInInitialized = false;
  bool _sessionRestored = false;
  String? _pendingGoogleIdToken;

  bool get isLoading => _isLoading;

  bool get obscurePassword => _obscurePassword;

  bool get rememberMe => _rememberMe;

  String? get errorMessage => _errorMessage;

  AuthResponse? get authResponse => _authResponse;

  bool get isLoggedIn => _authResponse != null;

  bool get isSessionRestored => _sessionRestored;

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
    String? phone,
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
    String? phone,
    required String password,
    required String emailVerificationToken,
    String? phoneIdToken,
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

      final firebaseCredential = kIsWeb
          ? await FirebaseAuth.instance.signInWithPopup(GoogleAuthProvider())
          : await _signInWithGoogleOnAndroid();
      final firebaseIdToken = await firebaseCredential.user?.getIdToken(true);

      if (firebaseIdToken == null || firebaseIdToken.isEmpty) {
        throw Exception('Firebase did not return an ID token.');
      }

      _pendingGoogleIdToken = firebaseIdToken;
      final response = await _repository.firebaseLogin(
        firebaseIdToken,
        createAccount: true,
      );
      _authResponse = response;
      await _saveSession(response);
      _pendingGoogleIdToken = null;

      return true;
    } catch (error) {
      _errorMessage = _googleErrorMessage(error);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<UserCredential> _signInWithGoogleOnAndroid() async {
    if (!_googleSignInInitialized) {
      await GoogleSignIn.instance.initialize();
      _googleSignInInitialized = true;
    }

    final googleAccount = await GoogleSignIn.instance.authenticate();
    final googleIdToken = googleAccount.authentication.idToken;

    if (googleIdToken == null || googleIdToken.isEmpty) {
      throw Exception('Google did not return an ID token.');
    }

    return FirebaseAuth.instance.signInWithCredential(
      GoogleAuthProvider.credential(idToken: googleIdToken),
    );
  }

  Future<bool> completeGoogleRegistration(String phoneIdToken) async {
    final googleIdToken = _pendingGoogleIdToken;
    if (googleIdToken == null || googleIdToken.isEmpty) {
      _errorMessage = 'Start Google signup again before verifying your phone.';
      notifyListeners();
      return false;
    }

    _setLoading(true);
    try {
      _errorMessage = null;
      final response = await _repository.firebaseLogin(
        googleIdToken,
        createAccount: true,
        phoneIdToken: phoneIdToken,
      );
      _authResponse = response;
      await _saveSession(response);
      _pendingGoogleIdToken = null;
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
    final normalized = message.toLowerCase();

    if (normalized.contains('canceled') || normalized.contains('cancelled')) {
      return 'Google sign-in was cancelled.';
    }
    if (normalized.contains('network') || normalized.contains('connection')) {
      return 'Unable to reach Google. Check your internet connection and try again.';
    }
    if (normalized.contains('developer_error') ||
        normalized.contains('api_exception: 10') ||
        normalized.contains('configuration')) {
      return 'Google sign-in is not configured for this app build. Please contact support.';
    }
    if (normalized.contains('invalid-credential') ||
        normalized.contains('credential') ||
        normalized.contains('id token')) {
      return 'Your Google sign-in session expired. Please try again.';
    }

    return 'Google sign-in could not be completed. Please try again.';
  }

  Future<void> logout() async {
    _errorMessage = null;

    try {
      // Push cleanup is best-effort. An expired network session must never
      // prevent the user from signing out locally.
      await _pushNotificationService.deactivate();
    } catch (_) {
      // Continue with token removal below.
    }

    try {
      await _repository.logout();
    } catch (_) {
      // AuthenticationService.logout clears stored tokens in its finally
      // block, even when the server rejects an expired token.
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
      if (_authResponse != null) {
        await _pushNotificationService.activate();
      }
    } catch (_) {
      _authResponse = null;
    } finally {
      _sessionRestored = true;
      notifyListeners();
    }
  }

  Future<void> _saveSession(AuthResponse response) async {
    await _repository.saveSession(response);
    // Web starts at the public landing page instead of SplashPage, so a
    // successful sign-in must mark session restoration complete here.
    _sessionRestored = true;
    await _pushNotificationService.activate();
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
