import 'package:dio/dio.dart';

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

  late final Dio _dio;
  final StorageService _storage;

  Dio get dio => _dio;
}

class _AuthenticationInterceptor extends QueuedInterceptor {
  _AuthenticationInterceptor(this._dio, this._storage);

  final Dio _dio;
  final StorageService _storage;

  bool _isAuthPath(RequestOptions options) =>
      options.path == ApiPaths.login ||
      options.path == ApiPaths.register ||
      options.path == ApiPaths.refresh;

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
    if (error.response?.statusCode != 401 ||
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
      if (accessToken == null || nextRefreshToken == null) {
        throw const ApiException('The server returned invalid refresh tokens.');
      }
      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: nextRefreshToken,
      );
      request
        ..headers['Authorization'] = 'Bearer $accessToken'
        ..extra['retried'] = true;
      final retry = await _dio.fetch<dynamic>(request);
      handler.resolve(retry);
    } catch (_) {
      await _storage.clearTokens();
      handler.next(error);
    }
  }
}

class _ApiErrorInterceptor extends Interceptor {
  @override
  void onError(DioException error, ErrorInterceptorHandler handler) {
    final data = error.response?.data;
    final message = data is Map<String, dynamic>
        ? _messageFrom(data['message'])
        : error.message ?? 'Network request failed.';
    handler.reject(
      DioException(
        requestOptions: error.requestOptions,
        response: error.response,
        type: error.type,
        error: ApiException(message, statusCode: error.response?.statusCode),
      ),
    );
  }

  String _messageFrom(dynamic value) => value is List
      ? value.join('\n')
      : value?.toString() ?? 'Network request failed.';
}
