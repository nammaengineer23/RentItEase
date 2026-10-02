import 'package:dio/dio.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart';

import '../../common/app_exception.dart';
import '../../config/environment.dart';
import '../services/storage_service.dart';
import 'request_policy.dart';

class ApiClient {
  ApiClient({Dio? dio, StorageService? storage})
    : _storage = storage ?? StorageService() {
    _dio =
        dio ??
        Dio(
          BaseOptions(
            baseUrl: Environment.apiBaseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            contentType: Headers.jsonContentType,
            headers: const {'Accept': Headers.jsonContentType},
          ),
        );
    _dio.interceptors.add(
      _AuthenticationInterceptor(
        _dio,
        _storage,
        onSessionExpired: () => onSessionExpired?.call(),
      ),
    );
    _dio.interceptors.add(_ApiErrorInterceptor());
  }

  static final ApiClient shared = ApiClient();

  VoidCallback? onSessionExpired;

  late final Dio _dio;

  final StorageService _storage;

  Dio get dio => _dio;

  void setAccessToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearAccessToken() {
    _dio.options.headers.remove('Authorization');
  }
}

class _AuthenticationInterceptor extends QueuedInterceptor {
  _AuthenticationInterceptor(
    this._dio,
    this._storage, {
    required this.onSessionExpired,
  });

  final Dio _dio;
  final StorageService _storage;
  final VoidCallback? onSessionExpired;
  Future<void>? _refreshInFlight;

  bool _isAuthPath(RequestOptions options) =>
      options.path == ApiPaths.login ||
      options.path == ApiPaths.register ||
      options.path == ApiPaths.refresh ||
      // Firebase login establishes a new session. It must not inherit a
      // stale bearer token from an earlier RentItEase session or trigger the
      // token-refresh retry path when Firebase rejects its proof.
      options.path == '/auth/firebase-login' ||
      options.path == '/auth/login/phone-otp';

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!_isAuthPath(options)) {
      final token = await _storage.getString(StorageService.accessTokenKey);
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    try {
      final appCheckToken = await FirebaseAppCheck.instance.getToken();
      if (appCheckToken != null && appCheckToken.isNotEmpty) {
        options.headers['X-Firebase-AppCheck'] = appCheckToken;
      }
    } catch (_) {
      // App Check is best-effort until backend enforcement is enabled. Do not
      // block startup or authentication when a provider is unavailable.
    }

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    final method = request.method.toUpperCase();
    final safeToRetry = RequestPolicy.canRetryAfterRefresh(method);
    if (error.response?.statusCode != 401 ||
        !safeToRetry ||
        _isAuthPath(request) ||
        request.extra['retried'] == true) {
      handler.next(error);
      return;
    }

    final refreshToken = await _storage.getString(
      StorageService.refreshTokenKey,
    );
    if (refreshToken == null || refreshToken.isEmpty) {
      handler.next(error);
      return;
    }

    try {
      _refreshInFlight ??= _refreshTokens(refreshToken).whenComplete(() {
        _refreshInFlight = null;
      });
      await _refreshInFlight;
      final accessToken = await _storage.getString(StorageService.accessTokenKey);
      if (accessToken == null || accessToken.isEmpty) {
        throw const ApiException('The session could not be refreshed.');
      }
      request
        ..headers['Authorization'] = 'Bearer $accessToken'
        ..extra['retried'] = true;
      final retry = await _dio.fetch<dynamic>(request);
      handler.resolve(retry);
    } catch (_) {
      await _storage.clearTokens();
      onSessionExpired?.call();
      handler.next(error);
    }
  }

  Future<void> _refreshTokens(String refreshToken) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiPaths.refresh,
      data: {'refreshToken': refreshToken},
      options: Options(extra: {'skipAuthRefresh': true}),
    );
    final responseData = response.data;
    final wrappedData = responseData?['data'];
    final data = wrappedData is Map<String, dynamic>
        ? wrappedData
        : responseData;
    final accessToken = data?['accessToken'] as String?;
    final nextRefreshToken = data?['refreshToken'] as String?;
    if (accessToken == null || nextRefreshToken == null ||
        accessToken.isEmpty || nextRefreshToken.isEmpty) {
      throw const ApiException('The server returned invalid refresh tokens.');
    }
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: nextRefreshToken,
    );
  }
}

class _ApiErrorInterceptor extends Interceptor {
  @override
  void onError(DioException error, ErrorInterceptorHandler handler) {
    final data = error.response?.data;
    final message = _mapError(error, data);
    handler.reject(
      DioException(
        requestOptions: error.requestOptions,
        response: error.response,
        type: error.type,
        error: ApiException(message, statusCode: error.response?.statusCode),
      ),
    );
  }

  String _mapError(DioException error, dynamic data) {
    if (error.type == DioExceptionType.cancel) return 'Request cancelled.';
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      return 'You appear to be offline. Check your internet connection and try again.';
    }
    if (error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return 'The server took too long to respond. Please try again.';
    }
    final status = error.response?.statusCode;
    if (status == 401) return 'Your session has expired. Please sign in again.';
    if (status == 403) return 'You do not have permission to perform this action.';
    if (status == 408 || status == 429) return 'Please wait a moment and try again.';
    if (status != null && status >= 500) return 'The server is temporarily unavailable. Please try again shortly.';
    if (data is Map) return _messageFromMap(Map<String, dynamic>.from(data));
    return 'The request could not be completed. Please try again.';
  }

  String _messageFrom(dynamic value) => value is List
      ? value.join('\n')
      : value?.toString() ?? 'Network request failed.';

  String _messageFromMap(Map<String, dynamic> data) {
    final direct = data['message'];
    if (direct != null) {
      final message = _messageFrom(direct);
      return message.length <= 500 ? message : 'The request could not be completed. Please try again.';
    }

    final nestedError = data['error'];
    if (nestedError is Map) {
      final message = nestedError['message'];
      if (message != null) return _messageFrom(message);
    } else if (nestedError != null) {
      return _messageFrom(nestedError);
    }

    final nestedData = data['data'];
    if (nestedData is Map) {
      return _messageFromMap(Map<String, dynamic>.from(nestedData));
    }
    return 'Network request failed.';
  }
}
