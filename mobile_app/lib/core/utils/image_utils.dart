import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:mime/mime.dart';
import 'package:path_provider/path_provider.dart';

class ImageUtils {
  ImageUtils._();

  /// Maximum size = 5 MB
  static const int maxFileSize = 5 * 1024 * 1024;

  static const List<String> allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  // =============================================
  // Validate Image Type
  // =============================================

  static bool isValidImage(File file) {
    final mime = lookupMimeType(file.path);

    return allowedMimeTypes.contains(mime);
  }

  // =============================================
  // Validate File Size
  // =============================================

  static Future<bool> isValidSize(
    File file,
  ) async {
    final size = await file.length();

    return size <= maxFileSize;
  }

  // =============================================
  // Compress Image
  // =============================================

  static Future<File> compressImage(
    File file,
  ) async {
    final tempDir =
        await getTemporaryDirectory();

    final targetPath =
        '${tempDir.path}/${DateTime.now().millisecondsSinceEpoch}.jpg';

    final compressed =
        await FlutterImageCompress.compressAndGetFile(
      file.absolute.path,
      targetPath,
      quality: 80,
      minWidth: 1920,
      minHeight: 1080,
    );

    if (compressed == null) {
      return file;
    }

    return File(compressed.path);
  }

  // =============================================
  // Validate + Compress
  // =============================================

  static Future<File> prepareImage(
    File file,
  ) async {
    if (!isValidImage(file)) {
      throw Exception(
        'Only JPG, PNG and WEBP images are allowed.',
      );
    }

    if (!await isValidSize(file)) {
      throw Exception(
        'Image size should be less than 5 MB.',
      );
    }

    final compressed =
        await compressImage(file);

    if (kDebugMode) {
      final original =
          await file.length();

      final reduced =
          await compressed.length();

      debugPrint(
        'Original: ${(original / 1024).toStringAsFixed(1)} KB',
      );

      debugPrint(
        'Compressed: ${(reduced / 1024).toStringAsFixed(1)} KB',
      );
    }

    return compressed;
  }

  // =============================================
  // Validate Multiple Images
  // =============================================

  static Future<List<File>> prepareImages(
    List<File> files,
  ) async {
    final List<File> output = [];

    for (final file in files) {
      output.add(
        await prepareImage(file),
      );
    }

    return output;
  }

  // =============================================
  // Human Readable Size
  // =============================================

  static String readableSize(
    int bytes,
  ) {
    if (bytes < 1024) {
      return '$bytes B';
    }

    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    }

    return '${(bytes / 1024 / 1024).toStringAsFixed(2)} MB';
  }
}