import 'package:dio/dio.dart';

import 'models/profile_model.dart';

class ProfileApi {
  ProfileApi(this._dio);

  final Dio _dio;

  //=========================================
  // Get Logged-in User Profile
  // GET /auth/me
  //=========================================

  Future<ProfileModel> getProfile() async {
    try {
      final response = await _dio.get('/auth/me');

      final data = response.data;

      final json = data is Map<String, dynamic>
          ? (data['data'] is Map<String, dynamic>
                ? data['data'] as Map<String, dynamic>
                : data)
          : <String, dynamic>{};

      return ProfileModel.fromJson(json);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ?? 'Failed to load profile.',
      );
    }
  }

  //=========================================
  // Update Profile
  // PATCH /users/profile
  //=========================================

  Future<ProfileModel> updateProfile({
    required String fullName,
    required String phone,
  }) async {
    try {
      final response = await _dio.patch(
        '/users/profile',
        data: {
          'fullName': fullName,
          'phone': phone,
        },
      );

      final data = response.data;

      final json = data is Map<String, dynamic>
          ? (data['data'] is Map<String, dynamic>
                ? data['data'] as Map<String, dynamic>
                : data)
          : <String, dynamic>{};

      return ProfileModel.fromJson(json);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ?? 'Failed to update profile.',
      );
    }
  }

  //=========================================
  // Upload Profile Image
  // POST /uploads/image
  //=========================================

  Future<String> uploadProfileImage(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });

      final response = await _dio.post(
        '/uploads/image',
        data: formData,
      );

      final data = response.data;

      if (data is Map<String, dynamic>) {
        return data['url'] ??
            data['imageUrl'] ??
            data['data']?['url'] ??
            '';
      }

      return '';
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ?? 'Image upload failed.',
      );
    }
  }
}