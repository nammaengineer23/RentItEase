import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';

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
  }) async {
    try {
      final data = <String, dynamic>{
        'fullName': fullName.trim(),
        if (phone.trim().isNotEmpty) 'phone': phone.trim(),
      };

      final response = await _dio.patch<dynamic>('/auth/me', data: data);

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
  // POST /auth/me/photo
  // ============================================================

  Future<String> uploadProfileImage(XFile image) async {
    try {
      final bytes = await image.readAsBytes();

      if (bytes.isEmpty || bytes.length > 5 * 1024 * 1024) {
        throw const FormatException(
          'Image size should be greater than 0 and less than 5 MB.',
        );
      }

      final mimeType = lookupMimeType(
        image.name.isEmpty ? image.path : image.name,
        headerBytes: bytes.take(32).toList(),
      );

      if (!const ['image/jpeg', 'image/png', 'image/webp'].contains(mimeType)) {
        throw const FormatException(
          'Only genuine JPG, PNG and WEBP images can be uploaded.',
        );
      }

      final extension = switch (mimeType) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        _ => throw const FormatException('Unsupported image format.'),
      };

      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(
          bytes,
          filename: 'profile-image.$extension',
          contentType: MediaType.parse(mimeType!),
        ),
      });

      final response = await _dio.post<dynamic>(
        '/auth/me/photo',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final json = _extractMap(response.data);
      final imageUrl = json['photoUrl'] ?? json['imageUrl'];

      if (imageUrl is String && imageUrl.trim().isNotEmpty) {
        return imageUrl.trim();
      }

      throw Exception(
        'Profile image upload succeeded but no image URL was returned.',
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data?.toString() ?? 'Image upload failed.');
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
