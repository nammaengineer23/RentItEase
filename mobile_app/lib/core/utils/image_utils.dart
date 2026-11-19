import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
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
    if (sourceBytes.isEmpty) {
      throw const FormatException('The selected photo is empty or unreadable.');
    }

    final sourceName = file.name.isEmpty ? file.path : file.name;
    final sourceMime = detectMimeType(sourceName, sourceBytes);
    final sourceExtension = sourceName.split('.').last.toLowerCase();
    final isHeic = sourceMime == 'image/heic' ||
        sourceMime == 'image/heif' ||
        sourceExtension == 'heic' ||
        sourceExtension == 'heif';
    final sourceIsSupported = allowedMimeTypes.contains(sourceMime);

    if (!sourceIsSupported && !isHeic) {
      throw const FormatException(
        'Only genuine JPG, PNG and WEBP photos are supported. Please choose or capture another photo.',
      );
    }

    // Native camera providers may return HEIC/HEIF even when the UI asks for
    // a regular photo. Re-encode on-device to JPEG before sending it to the
    // API, which intentionally accepts only JPEG, PNG and WEBP.
    if (kIsWeb && isHeic) {
      throw const FormatException(
        'This browser returned a HEIC/HEIF photo. Please capture or convert it to JPG, PNG or WEBP.',
      );
    }

    if (sourceBytes.length > 25 * 1024 * 1024) {
      throw const FormatException('The selected photo is too large to process.');
    }

    XFile prepared = file;
    if (!kIsWeb) {
      try {
        prepared = await compressImage(file);
      } catch (_) {
        throw const FormatException(
          'Could not process this photo. Please try capturing it again.',
        );
      }
    }

    final preparedBytes = await prepared.readAsBytes();
    final preparedMime = detectMimeType(
      prepared.name.isEmpty ? prepared.path : prepared.name,
      preparedBytes,
    );
    if (!allowedMimeTypes.contains(preparedMime)) {
      throw const FormatException(
        'Photo processing did not produce a supported JPG, PNG or WEBP image. Please try again.',
      );
    }
    if (preparedBytes.isEmpty || preparedBytes.length > maxFileSize) {
      throw const FormatException(
        'The processed photo must be less than 5 MB. Please choose a smaller image.',
      );
    }

    if (kDebugMode) {
      debugPrint('Original: ${(sourceBytes.length / 1024).toStringAsFixed(1)} KB');
      debugPrint('Prepared: ${(preparedBytes.length / 1024).toStringAsFixed(1)} KB');
      debugPrint('Prepared format: $preparedMime');
    }
    return prepared;
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
