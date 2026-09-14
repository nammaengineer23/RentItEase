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
    if (video.size > 100 * 1024 * 1024) {
      throw const FormatException(
        'The property video must not exceed 100 MB.',
      );
    }

    final multipartFile = video.bytes != null
        ? MultipartFile.fromBytes(video.bytes!, filename: video.name)
        : await MultipartFile.fromFile(
            video.path!,
            filename: video.name,
          );

    final response = await _dio.post<Map<String, dynamic>>(
      '/property-images/$propertyId/video',
      data: FormData.fromMap({'file': multipartFile}),
      options: Options(contentType: 'multipart/form-data'),
      onSendProgress: (sent, total) {
        // Dio keeps the request streaming on supported platforms.
      },
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
