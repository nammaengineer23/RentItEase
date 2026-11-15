import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:mime/mime.dart';

import '../../../../core/utils/app_image_url.dart';

class PropertyImageRecord {
  const PropertyImageRecord({
    required this.id,
    required this.imageUrl,
    required this.section,
    required this.isPrimary,
  });

  final String id;
  final String imageUrl;
  final String section;
  final bool isPrimary;

  factory PropertyImageRecord.fromJson(Map<String, dynamic> json) {
    return PropertyImageRecord(
      id: json['id']?.toString() ?? '',
      imageUrl: AppImageUrl.resolve(json['imageUrl'] ?? json['url']),
      section: json['section']?.toString() ?? 'OTHER',
      isPrimary: json['isPrimary'] == true,
    );
  }
}

class PropertyImageApi {
  PropertyImageApi(this._dio);

  final Dio _dio;

  Future<List<PropertyImageRecord>> getImages(String propertyId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/property-images/$propertyId',
    );
    final root = response.data ?? const <String, dynamic>{};
    final data = root['data'] is Map
        ? Map<String, dynamic>.from(root['data'] as Map)
        : root;
    final rawImages = data['images'];

    if (rawImages is! List) return const [];

    return rawImages
        .whereType<Map>()
        .map(
          (image) => PropertyImageRecord.fromJson(
            Map<String, dynamic>.from(image),
          ),
        )
        .toList();
  }

  Future<void> uploadSectionImages({
    required String propertyId,
    required Map<String, List<File>> imagesBySection,
    bool assignFirstAsPrimary = true,
  }) async {
    var primaryAssigned = !assignFirstAsPrimary;

    for (final entry in imagesBySection.entries) {
      final images = entry.value;
      if (images.isEmpty) continue;
      if (images.length > 2) {
        throw FormatException(
          '${entry.key} supports a maximum of 2 photos.',
        );
      }

      final files = <MultipartFile>[];
      for (final image in images) {
        // Do not trust the temporary camera/blob path for the multipart
        // filename. Some camera providers omit the extension entirely.
        final bytes = await image.readAsBytes();
        final mimeType = lookupMimeType(
          image.path,
          headerBytes: bytes.take(32).toList(),
        );
        final extension = switch (mimeType) {
          'image/jpeg' => 'jpg',
          'image/png' => 'png',
          'image/webp' => 'webp',
          _ => throw const FormatException(
              'Only JPG, PNG and WEBP images can be uploaded.',
            ),
        };
        files.add(
          MultipartFile.fromBytes(
            bytes,
            filename: 'property-image.$extension',
          ),
        );
      }

      await _dio.post(
        '/property-images/$propertyId',
        data: FormData.fromMap({
          'files': files,
          'section': entry.key,
          'isPrimary': !primaryAssigned,
        }),
        options: Options(contentType: 'multipart/form-data'),
      );

      primaryAssigned = true;
    }
  }

  Future<void> deleteImage({
    required String propertyId,
    required String imageId,
  }) {
    return _dio.delete('/property-images/$propertyId/$imageId');
  }
}
