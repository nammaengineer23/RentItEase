import 'dart:io';

import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../../../../core/utils/app_image_url.dart';

class PropertyVideoApi {
  PropertyVideoApi(this._dio);

  final Dio _dio;

  Future<String> uploadVideo({
    required String propertyId,
    required File video,
  }) async {
    final size = await video.length();
    if (size > 100 * 1024 * 1024) {
      throw const FormatException(
        'The property video must not exceed 100 MB.',
      );
    }

    final extension = video.path.split('.').last.toLowerCase();
    final mimeSubtype = extension == 'mov' ? 'quicktime' : extension == 'm4v' ? 'x-m4v' : 'mp4';
    final multipartFile = await MultipartFile.fromFile(
      video.path,
      filename: video.path.split(Platform.pathSeparator).last,
      contentType: MediaType('video', mimeSubtype),
    );

    late final Response<Map<String, dynamic>> response;
    try {
      response = await _dio.post<Map<String, dynamic>>(
        '/property-images/$propertyId/video',
        data: FormData.fromMap({'file': multipartFile}),
        options: Options(
          contentType: 'multipart/form-data',
          sendTimeout: const Duration(minutes: 3),
          receiveTimeout: const Duration(minutes: 3),
        ),
      );
    } on DioException catch (error) {
      throw FormatException(_uploadErrorMessage(error));
    }

    dynamic value = response.data;
    while (value is Map && value.containsKey('data')) {
      value = value['data'];
    }

    if (value is Map) {
      return AppImageUrl.resolve(value['videoUrl']);
    }
    return '';
  }

  String _uploadErrorMessage(DioException error) {
    dynamic value = error.response?.data;
    while (value is Map && value.containsKey('data')) {
      value = value['data'];
    }

    if (value is Map) {
      final message = value['message'];
      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
      if (message is List && message.isNotEmpty) {
        return message.map((item) => item.toString()).join(' ');
      }
    }

    if (error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionTimeout) {
      return 'The video upload timed out. Check your connection and try again.';
    }

    if (error.type == DioExceptionType.connectionError) {
      return 'Could not connect while uploading the video. Check your connection and try again.';
    }

    return 'Video upload failed. Please try again.';
  }

  Future<void> deleteVideo(String propertyId) {
    return _dio.delete('/property-images/$propertyId/video');
  }
}
