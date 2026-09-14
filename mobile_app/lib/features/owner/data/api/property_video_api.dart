import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';

import '../../../../core/utils/app_image_url.dart';

class PropertyVideoApi {
  PropertyVideoApi(this._dio);

  final Dio _dio;

  Future<String> uploadVideo({
    required String propertyId,
    required PlatformFile video,
  }) async {
    final size = await video.length();
    if (size == null || size > 100 * 1024 * 1024) {
      throw const FormatException(
        'The property video must not exceed 100 MB.',
      );
    }

    final multipartFile = MultipartFile.fromBytes(
      await video.readAsBytes(),
      filename: video.name,
    );

    final response = await _dio.post<Map<String, dynamic>>(
      '/property-images/$propertyId/video',
      data: FormData.fromMap({'file': multipartFile}),
      options: Options(contentType: 'multipart/form-data'),
    );

    dynamic value = response.data;
    while (value is Map && value.containsKey('data')) {
      value = value['data'];
    }

    if (value is Map) {
      return AppImageUrl.resolve(value['videoUrl']);
    }
    return '';
  }

  Future<void> deleteVideo(String propertyId) {
    return _dio.delete('/property-images/$propertyId/video');
  }
}
