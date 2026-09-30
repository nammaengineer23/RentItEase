import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import 'package:video_compress/video_compress.dart';

import '../../core/network/api_client.dart';

enum MediaKind { image, video, audio }

class MediaLimits {
  static const int maxImageBytes = 10 * 1024 * 1024;
  static const int maxVideoBytes = 100 * 1024 * 1024;
  static const int maxAudioBytes = 25 * 1024 * 1024;
  static const int maxImageWidth = 2048;
  static const int maxImageHeight = 2048;
}

class MediaUploadResult {
  const MediaUploadResult({
    required this.data,
    required this.bytesSent,
    required this.totalBytes,
  });

  final Map<String, dynamic> data;
  final int bytesSent;
  final int totalBytes;
}

class MediaService {
  MediaService({Dio? dio, ImagePicker? picker})
      : _dio = dio ?? ApiClient.shared.dio,
        _picker = picker ?? ImagePicker();

  final Dio _dio;
  final ImagePicker _picker;

  Future<File> compressImage(XFile source) async {
    _ensureMobileFileOperationsSupported();
    final input = File(source.path);
    final size = await input.length();
    if (size > MediaLimits.maxImageBytes * 2) {
      throw const MediaUploadException('Image is too large to process.');
    }

    final directory = await getTemporaryDirectory();
    final target = File(
      '${directory.path}/rentease_image_${DateTime.now().microsecondsSinceEpoch}.jpg',
    );

    final result = await FlutterImageCompress.compressAndGetFile(
      input.path,
      target.path,
      minWidth: MediaLimits.maxImageWidth,
      minHeight: MediaLimits.maxImageHeight,
      quality: 82,
      format: CompressFormat.jpeg,
      keepExif: false,
    );
    if (result == null) {
      throw const MediaUploadException('Image compression failed.');
    }

    final compressed = File(result.path);
    if (await compressed.length() > MediaLimits.maxImageBytes) {
      throw const MediaUploadException('Compressed image exceeds the 10 MB limit.');
    }
    return compressed;
  }

  Future<File> compressVideo(XFile source) async {
    if (kIsWeb) {
      throw const MediaUploadException(
        'Video compression is not available in the web client.',
      );
    }

    final input = File(source.path);
    if (await input.length() > MediaLimits.maxVideoBytes * 2) {
      throw const MediaUploadException('Video is too large to process.');
    }

    final info = await VideoCompress.compressVideo(
      input.path,
      quality: VideoQuality.MediumQuality,
      deleteOrigin: false,
      includeAudio: true,
    );
    final output = info?.file;
    if (output == null) {
      throw const MediaUploadException('Video compression failed.');
    }

    if (await output.length() > MediaLimits.maxVideoBytes) {
      throw const MediaUploadException('Compressed video exceeds the 100 MB limit.');
    }
    return output;
  }

  Future<XFile?> pickImage({ImageSource source = ImageSource.gallery}) async {
    if (source == ImageSource.camera) {
      final permission = await Permission.camera.request();
      if (!permission.isGranted) {
        throw const MediaUploadException('Camera permission is required.');
      }
    } else {
      await _requestGalleryPermission();
    }
    return _picker.pickImage(source: source, imageQuality: 90);
  }

  Future<XFile?> pickVideo({ImageSource source = ImageSource.gallery}) async {
    if (source == ImageSource.camera) {
      final camera = await Permission.camera.request();
      if (!camera.isGranted) {
        throw const MediaUploadException('Camera permission is required.');
      }
    } else {
      await _requestGalleryPermission();
    }
    return _picker.pickVideo(source: source);
  }

  Future<void> _requestGalleryPermission() async {
    if (kIsWeb) return;
    final permission = await Permission.photos.request();
    if (!permission.isGranted && !permission.isLimited) {
      throw const MediaUploadException(
        'Photo and media library permission is required.',
      );
    }
  }

  Future<MediaRecorderSession> startAudioRecording() async {
    if (kIsWeb) {
      throw const MediaUploadException(
        'Audio recording is not supported by this mobile recorder flow on web.',
      );
    }

    final permission = await Permission.microphone.request();
    if (!permission.isGranted) {
      throw const MediaUploadException('Microphone permission is required.');
    }

    final recorder = AudioRecorder();
    if (!await recorder.hasPermission()) {
      await recorder.dispose();
      throw const MediaUploadException('Microphone permission is required.');
    }

    final directory = await getTemporaryDirectory();
    final path =
        '${directory.path}/rentease_audio_${DateTime.now().microsecondsSinceEpoch}.m4a';

    await recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 44100,
      ),
      path: path,
    );

    return MediaRecorderSession._(recorder, path);
  }

  Future<MediaUploadResult> upload({
    required File file,
    required String endpoint,
    required MediaKind kind,
    String fieldName = 'file',
    CancelToken? cancelToken,
    void Function(int sent, int total)? onProgress,
    int maxAttempts = 2,
  }) async {
    final size = await file.length();
    _validateSize(size, kind);

    final type = lookupMimeType(file.path) ?? _fallbackMime(kind);
    Object? lastError;

    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      final request = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(
          file.path,
          filename: file.uri.pathSegments.last,
          contentType: MediaType.parse(type),
        ),
      });

      try {
        final response = await _dio.post<dynamic>(
          endpoint,
          data: request,
          cancelToken: cancelToken,
          onSendProgress: onProgress,
          options: Options(headers: {'X-Upload-Attempt': '$attempt'}),
        );

        final body = response.data;
        final data = body is Map
            ? Map<String, dynamic>.from(body)
            : <String, dynamic>{'data': body};

        return MediaUploadResult(
          data: data,
          bytesSent: size,
          totalBytes: size,
        );
      } on DioException catch (error) {
        if (CancelToken.isCancel(error)) rethrow;
        lastError = error;
        if (!_isRetryable(error) || attempt == maxAttempts) rethrow;
        await Future<void>.delayed(Duration(milliseconds: 500 * attempt));
      }
    }

    throw MediaUploadException(
      'Media upload failed after $maxAttempts attempts: $lastError',
    );
  }

  Future<void> cleanupTemporaryFile(File file) async {
    try {
      if (await file.exists()) await file.delete();
    } catch (_) {}
  }

  void _validateSize(int bytes, MediaKind kind) {
    final limit = switch (kind) {
      MediaKind.image => MediaLimits.maxImageBytes,
      MediaKind.video => MediaLimits.maxVideoBytes,
      MediaKind.audio => MediaLimits.maxAudioBytes,
    };
    if (bytes > limit) {
      final limitMb = limit ~/ (1024 * 1024);
      throw MediaUploadException(
        'This $kind file exceeds $limitMb MB limit.',
      );
    }
  }

  bool _isRetryable(DioException error) =>
      error.type == DioExceptionType.connectionError ||
      error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.sendTimeout ||
      error.type == DioExceptionType.receiveTimeout;

  String _fallbackMime(MediaKind kind) => switch (kind) {
        MediaKind.image => 'image/jpeg',
        MediaKind.video => 'video/mp4',
        MediaKind.audio => 'audio/mp4',
      };

  void _ensureMobileFileOperationsSupported() {
    if (kIsWeb) {
      throw const MediaUploadException(
        'This file compression operation is available on Android and iOS only.',
      );
    }
  }
}

class MediaRecorderSession {
  MediaRecorderSession._(this._recorder, this.path);

  final AudioRecorder _recorder;
  final String path;

  Future<String?> stop() async {
    final result = await _recorder.stop();
    await _recorder.dispose();
    return result ?? path;
  }

  Future<void> cancel() async {
    await _recorder.cancel();
    await _recorder.dispose();
    try {
      final file = File(path);
      if (await file.exists()) await file.delete();
    } catch (_) {}
  }
}

class MediaUploadException implements Exception {
  const MediaUploadException(this.message);

  final String message;

  @override
  String toString() => message;
}
