import 'package:dio/dio.dart';

import '../config/app_config.dart';

class ApiClient {
  ApiClient._();

  static final instance = ApiClient._internal();

  late final Dio dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  ApiClient._internal() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) => handler.next(error),
      ),
    );
  }
}
