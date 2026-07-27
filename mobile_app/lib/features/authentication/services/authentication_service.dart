import 'package:dio/dio.dart';

import '../data/models/auth_response.dart';
import '../data/models/login_request.dart';
import '../data/models/register_request.dart';

class AuthenticationService {
  AuthenticationService()
      : _dio = Dio(
          BaseOptions(
            baseUrl: 'http://10.0.2.2:3000/api/v1',
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );

  final Dio _dio;

  Future<AuthResponse> login(
    LoginRequest request,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: request.toJson(),
      );

      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ??
            'Login failed',
      );
    }
  }

  Future<AuthResponse> register(
    RegisterRequest request,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/register',
        data: request.toJson(),
      );

      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ??
            'Registration failed',
      );
    }
  }

  Future<void> logout() async {
    // Will be implemented later.
  }

  Future<void> refreshToken() async {
    // Will be implemented later.
  }

  Future<void> firebaseLogin(
    String idToken,
  ) async {
    // Will be implemented later.
  }
}