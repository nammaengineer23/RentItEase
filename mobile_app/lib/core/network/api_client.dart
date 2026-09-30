import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../common/app_exception.dart';
import '../../config/environment.dart';
import '../services/storage_service.dart';

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
    _dio.interceptors.add(_AuthenticationInterceptor(_dio, _storage));
    _dio.interceptors.add(_ApiErrorInterceptor());
  }

  static final ApiClient shared = ApiClient();

  VoidCallback? onSessionExpired;

  late final Dio _dio;

  final StorageService _storage;
  Future<void>? _refreshInFlight;

  Dio get dio => _dio;

  void setAccessToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearAccessToken() {
    _dio.options.headers.remove('Authorization');
  }
}

class _AuthenticationInterceptor extends QueuedInterceptor {
  _AuthenticationInterceptor(this._dio, this._storage);

  final Dio _dio;
  final StorageService _storage;

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
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    final method = request.method.toUpperCase();
    final safeToRetry = method == 'GET' || method == 'HEAD' || method == 'OPTIONS';
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
    if (data is Map) {
      return _messageFromMap(Map<String, dynamic>.from(data));
    }
    return error.message ?? 'Network request failed.';
  }

  String _messageFrom(dynamic value) => value is List
      ? value.join('\n')
      : value?.toString() ?? 'Network request failed.';

  String _messageFromMap(Map<String, dynamic> data) {
    final direct = data['message'];
    if (direct != null) return _messageFrom(direct);

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
