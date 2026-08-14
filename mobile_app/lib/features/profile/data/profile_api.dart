import 'package:dio/dio.dart';

import 'models/profile_model.dart';

class ProfileApi {
  ProfileApi(this._dio);

  final Dio _dio;

  // ============================================================
  // GET CURRENT USER
  // GET /auth/me
  // ============================================================

  Future<ProfileModel> getProfile() async {
    try {
      final response = await _dio.get<dynamic>('/auth/me');

      final json = _extractMap(response.data);

      return ProfileModel.fromJson(json);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ?? 'Failed to load profile.',
      );
    }
  }

  // ============================================================
  // UPDATE CURRENT USER
  // PATCH /auth/me
  // ============================================================

  Future<ProfileModel> updateProfile({
    required String fullName,
    required String phone,
    String? photoUrl,
  }) async {
    try {
      final data = <String, dynamic>{
        'fullName': fullName.trim(),
        'phone': phone.trim(),
      };

      if (photoUrl != null && photoUrl.trim().isNotEmpty) {
        data['photoUrl'] = photoUrl.trim();
      }

      final response = await _dio.patch<dynamic>(
        '/auth/me',
        data: data,
      );

      final json = _extractMap(response.data);

      return ProfileModel.fromJson(json);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ?? 'Failed to update profile.',
      );
    }
  }

  // ============================================================
  // UPLOAD PROFILE IMAGE
  // POST /uploads/image
  // ============================================================

  Future<String> uploadProfileImage(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });

      final response = await _dio.post<dynamic>(
        '/uploads/image',
        data: formData,
      );

      final data = response.data;

      if (data is Map<String, dynamic>) {
        final directUrl = data['url'];
        if (directUrl is String && directUrl.isNotEmpty) {
          return directUrl;
        }

        final imageUrl = data['imageUrl'];
        if (imageUrl is String && imageUrl.isNotEmpty) {
          return imageUrl;
        }

        final nested = data['data'];
        if (nested is Map<String, dynamic>) {
          final nestedUrl = nested['url'];
          if (nestedUrl is String && nestedUrl.isNotEmpty) {
            return nestedUrl;
          }

          final nestedImageUrl = nested['imageUrl'];
          if (nestedImageUrl is String && nestedImageUrl.isNotEmpty) {
            return nestedImageUrl;
          }
        }
      }

      throw Exception('Image upload succeeded but no image URL was returned.');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ?? 'Image upload failed.',
      );
    }
  }

  // ============================================================
  // RESPONSE HELPER
  // ============================================================

  Map<String, dynamic> _extractMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      final nested = data['data'];

      if (nested is Map<String, dynamic>) {
        return nested;
      }

      return data;
    }

    return <String, dynamic>{};
  }
}