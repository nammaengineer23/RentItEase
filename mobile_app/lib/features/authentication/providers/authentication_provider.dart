import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../common/app_exception.dart';
import '../../../core/config/auth_features.dart';
import '../../../core/navigation/route_persistence_service.dart';
import '../data/models/auth_response.dart';
import '../data/models/login_request.dart';
import '../data/models/register_request.dart';
import '../data/repositories/authentication_repository_impl.dart';
import '../../notifications/services/push_notification_service.dart';

final authenticationProvider = ChangeNotifierProvider<AuthenticationProvider>((ref) {
  return AuthenticationProvider();
});

class AuthenticationProvider extends ChangeNotifier {
  AuthenticationProvider({
    AuthenticationRepositoryImpl? repository,
    PushNotificationService? pushNotificationService,
  }) : _repository = repository ?? AuthenticationRepositoryImpl(),
       _pushNotificationService = pushNotificationService ?? PushNotificationService() {
    _loadRememberMePreference();
  }

  static const _rememberMeKey = 'auth_remember_me';
  static const _rememberedEmailKey = 'auth_remembered_email';

  final AuthenticationRepositoryImpl _repository;
  final PushNotificationService _pushNotificationService;

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberMe = false;
  bool _rememberPreferenceLoaded = false;
  String? _rememberedEmail;
  String? _errorMessage;
  AuthResponse? _authResponse;
  bool _googleSignInInitialized = false;
  bool _sessionRestored = false;
  Future<void>? _sessionRestoreFuture;
  String? _pendingGoogleIdToken;

  bool get isLoading => _isLoading;
  bool get obscurePassword => _obscurePassword;
  bool get rememberMe => _rememberMe;
  bool get rememberPreferenceLoaded => _rememberPreferenceLoaded;
  String? get rememberedEmail => _rememberedEmail;
  String? get errorMessage => _errorMessage;
  AuthResponse? get authResponse => _authResponse;
  bool get isLoggedIn => _authResponse != null;
  bool get isSessionRestored => _sessionRestored;

  void togglePasswordVisibility() {
    _obscurePassword = !_obscurePassword;
    notifyListeners();
  }

  Future<void> _loadRememberMePreference() async {
    final prefs = await SharedPreferences.getInstance();
    _rememberMe = prefs.getBool(_rememberMeKey) ?? false;
    _rememberedEmail = _rememberMe ? prefs.getString(_rememberedEmailKey) : null;
    _rememberPreferenceLoaded = true;
    notifyListeners();
  }

  Future<void> setRememberMe(bool value) async {
    _rememberMe = value;
    if (!value) _rememberedEmail = null;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_rememberMeKey, value);
    if (!value) await prefs.remove(_rememberedEmailKey);
  }

  Future<void> _rememberSuccessfulLogin(String email) async {
    if (!_rememberMe) return;
    final normalized = email.trim();
    if (normalized.isEmpty) return;
    _rememberedEmail = normalized;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_rememberMeKey, true);
    await prefs.setString(_rememberedEmailKey, normalized);
  }

  Future<bool> login({required String email, required String password}) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      final response = await _repository.login(LoginRequest(email: email, password: password));
      _authResponse = response;
      await _saveSession(response);
      await _rememberSuccessfulLogin(email);
      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<bool> register({required String fullName, required String email, String? phone, required String password}) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      final response = await _repository.register(RegisterRequest(fullName: fullName, email: email, phone: phone, password: password));
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
    try { _errorMessage = null; await _repository.forgotPassword(email.trim().toLowerCase()); return true; }
    catch (error) { _errorMessage = error.toString(); return false; }
    finally { _setLoading(false); }
  }

  Future<bool> requestSignupEmailOtp(String email) async {
    _setLoading(true);
    try { _errorMessage = null; await _repository.requestSignupEmailOtp(email); return true; }
    catch (error) { _errorMessage = error.toString(); return false; }
    finally { _setLoading(false); }
  }

  Future<String?> verifySignupEmailOtp(String email, String otp) async {
    _setLoading(true);
    try { _errorMessage = null; return await _repository.verifySignupEmailOtp(email, otp); }
    catch (error) { _errorMessage = error.toString(); return null; }
    finally { _setLoading(false); }
  }

  Future<bool> registerVerified({required String fullName, required String email, String? phone, required String password, required String emailVerificationToken, String? phoneIdToken}) async {
    _setLoading(true);
    try {
      _errorMessage = null;
      final response = await _repository.registerVerified(RegisterRequest(fullName: fullName, email: email, phone: phone, password: password), emailVerificationToken: emailVerificationToken, phoneIdToken: phoneIdToken);
      _authResponse = response; await _saveSession(response); return true;
    } catch (error) { _errorMessage = error.toString(); return false; }
    finally { _setLoading(false); }
  }

  Future<bool> requestLoginEmailOtp(String email) async {
    _setLoading(true);
    try { _errorMessage = null; await _repository.requestLoginEmailOtp(email); return true; }
    catch (error) { _errorMessage = error.toString(); return false; }
    finally { _setLoading(false); }
  }

  Future<bool> loginWithEmailOtp(String email, String otp) async {
    _setLoading(true);
    try { _errorMessage = null; final response = await _repository.loginWithEmailOtp(email, otp); _authResponse = response; await _saveSession(response); await _rememberSuccessfulLogin(email); return true; }
    catch (error) { _errorMessage = error.toString(); return false; }
    finally { _setLoading(false); }
  }

  Future<bool> loginWithPhoneOtp(String idToken) async {
    _setLoading(true);
    try { _errorMessage = null; final response = await _repository.loginWithPhoneOtp(idToken); _authResponse = response; await _saveSession(response); return true; }
    catch (error) { _errorMessage = error.toString(); return false; }
    finally { _setLoading(false); }
  }

  Future<bool> signInWithGoogle() async {
    _setLoading(true); var stage = 'Google account selection';
    try {
      _errorMessage = null;
      final firebaseCredential = kIsWeb ? await FirebaseAuth.instance.signInWithPopup(GoogleAuthProvider()) : await _signInWithGoogleOnAndroid();
      stage = 'Firebase account verification';
      final firebaseIdToken = await firebaseCredential.user?.getIdToken(true);
      if (firebaseIdToken == null || firebaseIdToken.isEmpty) throw Exception('Firebase did not return an ID token.');
      _pendingGoogleIdToken = firebaseIdToken; stage = 'RentItEase account sign-in';
      final response = await _repository.firebaseLogin(firebaseIdToken, createAccount: true);
      _authResponse = response; await _saveSession(response); _pendingGoogleIdToken = null; return true;
    } catch (error, stackTrace) {
      debugPrint('Google sign-in failed during $stage: ${error.runtimeType}: $error');
      debugPrintStack(stackTrace: stackTrace, label: 'Google sign-in failure');
      _errorMessage = _googleErrorMessage(error, stage: stage); return false;
    } finally { _setLoading(false); }
  }

  Future<UserCredential> _signInWithGoogleOnAndroid() async {
    if (!_googleSignInInitialized) { await GoogleSignIn.instance.initialize(serverClientId: googleServerClientId); _googleSignInInitialized = true; }
    final googleAccount = await GoogleSignIn.instance.authenticate();
    final googleIdToken = googleAccount.authentication.idToken;
    if (googleIdToken == null || googleIdToken.isEmpty) throw Exception('Google did not return an ID token.');
    return FirebaseAuth.instance.signInWithCredential(GoogleAuthProvider.credential(idToken: googleIdToken));
  }

  Future<bool> completeGoogleRegistration(String phoneIdToken) async {
    final googleIdToken = _pendingGoogleIdToken;
    if (googleIdToken == null || googleIdToken.isEmpty) { _errorMessage = 'Start Google signup again before verifying your phone.'; notifyListeners(); return false; }
    _setLoading(true);
    try { _errorMessage = null; final response = await _repository.firebaseLogin(googleIdToken, createAccount: true, phoneIdToken: phoneIdToken); _authResponse = response; await _saveSession(response); _pendingGoogleIdToken = null; return true; }
    catch (error) { _errorMessage = _googleErrorMessage(error, stage: 'RentItEase account setup'); return false; }
    finally { _setLoading(false); }
  }

  String _googleErrorMessage(Object error, {required String stage}) {
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'network-request-failed': return 'Unable to reach Firebase. Check your internet connection and try again.';
        case 'app-not-authorized': case 'operation-not-allowed': return 'Google sign-in is not enabled for this app. Please contact support.';
        case 'invalid-credential': case 'invalid-user-token': case 'user-token-expired': return 'Your Google sign-in session expired. Please try again.';
      }
      return 'Google account selection succeeded, but Firebase could not verify it (${error.code}). Please try again.';
    }
    if (error is DioException) {
      final apiError = error.error; final detail = apiError is ApiException ? apiError.message : null;
      if (detail != null && detail.isNotEmpty) return 'Google account verified, but RentItEase sign-in could not finish: $detail';
      return 'Google account verified, but RentItEase sign-in could not finish. Please try again.';
    }
    final normalized = error.toString().toLowerCase();
    if (normalized.contains('canceled') || normalized.contains('cancelled')) return 'Google sign-in was cancelled.';
    if (normalized.contains('network') || normalized.contains('connection')) return 'Unable to reach Google. Check your internet connection and try again.';
    if (normalized.contains('developer_error') || normalized.contains('api_exception: 10') || normalized.contains('configuration')) return 'Google sign-in is not configured for this app build. Please contact support.';
    if (normalized.contains('invalid-credential') || normalized.contains('credential') || normalized.contains('id token')) return 'Your Google sign-in session expired. Please try again.';
    return 'Google sign-in could not be completed during $stage. Please try again.';
  }

  Future<void> logout() async {
    _errorMessage = null;
    try { await _pushNotificationService.deactivate(); } catch (_) {}
    try { await _repository.logout(); } catch (_) {}
    finally { _authResponse = null; _isLoading = false; await RoutePersistenceService.clear(); notifyListeners(); }
  }

  Future<void> loadSavedSession() => _sessionRestoreFuture ??= _restoreSavedSession();

  Future<void> _restoreSavedSession() async {
    try { _authResponse = await _repository.restoreSession(); if (_authResponse != null) await _pushNotificationService.activate(); }
    catch (_) { _authResponse = null; }
    finally { _sessionRestored = true; notifyListeners(); }
  }

  Future<void> _saveSession(AuthResponse response) async {
    await _repository.saveSession(response); _sessionRestored = true; await _pushNotificationService.activate();
  }

  void clearError() { _errorMessage = null; notifyListeners(); }
  void _setLoading(bool value) { _isLoading = value; notifyListeners(); }
}
