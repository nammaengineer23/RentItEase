import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/utils/image_utils.dart';

void main() {
  group('ImageUtils image signature validation', () {
    test('accepts JPEG bytes without a filename extension', () {
      const bytes = <int>[0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
      expect(ImageUtils.isValidImage('camera-capture', headerBytes: bytes), isTrue);
      expect(
        ImageUtils.detectMimeType('camera-capture', bytes),
        'image/jpeg',
      );
    });

    test('accepts PNG bytes without a filename extension', () {
      const bytes = <int>[
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d,
      ];
      expect(ImageUtils.isValidImage('camera-capture', headerBytes: bytes), isTrue);
      expect(
        ImageUtils.detectMimeType('camera-capture', bytes),
        'image/png',
      );
    });

    test('accepts WEBP bytes without a filename extension', () {
      const bytes = <int>[
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
      ];
      expect(ImageUtils.isValidImage('camera-capture', headerBytes: bytes), isTrue);
      expect(
        ImageUtils.detectMimeType('camera-capture', bytes),
        'image/webp',
      );
    });

    test('rejects unsupported image signatures', () {
      const bytes = <int>[0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
      expect(ImageUtils.isValidImage('camera-capture', headerBytes: bytes), isFalse);
    });
  });
}
