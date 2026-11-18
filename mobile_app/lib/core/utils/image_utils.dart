import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:path_provider/path_provider.dart';

class ImageUtils {
  ImageUtils._();

  static const int maxFileSize = 5 * 1024 * 1024;

  static const List<String> allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  /// Detect the format from the actual bytes first. The path is only a
  /// fallback for providers that return no signature bytes.
  static String? detectMimeType(String path, List<int> bytes) {
    return lookupMimeType(path, headerBytes: bytes.take(32).toList());
  }

  static bool isValidImage(String path, {List<int>? headerBytes}) {
    final mime = lookupMimeType(path, headerBytes: headerBytes);
    return allowedMimeTypes.contains(mime);
  }

  static Future<bool> isValidSize(File file) async {
    return await file.length() <= maxFileSize;
  }

  static Future<XFile> compressImage(XFile file) async {
    // XFile.readAsBytes works with browser blob URLs. Native compression
    // requires a real filesystem path, so only use it off the Web.
    if (kIsWeb) return file;

    final tempDir = await getTemporaryDirectory();
    final targetPath =
        '${tempDir.path}/${DateTime.now().microsecondsSinceEpoch}.jpg';
    final compressed = await FlutterImageCompress.compressAndGetFile(
      file.path,
      targetPath,
      quality: 80,
      minWidth: 1920,
      minHeight: 1080,
    );
    return compressed ?? file;
  }

  static Future<XFile> prepareImage(XFile file) async {
    final sourceBytes = await file.readAsBytes();
    final mime = detectMimeType(file.name.isEmpty ? file.path : file.name, sourceBytes);

    if (!allowedMimeTypes.contains(mime)) {
      throw Exception('Only genuine JPG, PNG and WEBP images are allowed.');
    }
    if (sourceBytes.isEmpty || sourceBytes.length > maxFileSize) {
      throw Exception('Image size should be greater than 0 and less than 5 MB.');
    }

    final compressed = await compressImage(file);
    if (kDebugMode) {
      final reduced = kIsWeb ? sourceBytes.length : await compressed.length();
      debugPrint('Original: ${(sourceBytes.length / 1024).toStringAsFixed(1)} KB');
      debugPrint('Prepared: ${(reduced / 1024).toStringAsFixed(1)} KB');
    }
    return compressed;
  }

  static Future<List<XFile>> prepareImages(List<XFile> files) async {
    final output = <XFile>[];
    for (final file in files) {
      output.add(await prepareImage(file));
    }
    return output;
  }

  static String readableSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    }
    return '${(bytes / 1024 / 1024).toStringAsFixed(2)} MB';
  }
}
