import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/core/media/media_service.dart';

void main() {
  group('MediaLimits', () {
    test('defines bounded media sizes', () {
      expect(MediaLimits.maxImageBytes, 10 * 1024 * 1024);
      expect(MediaLimits.maxVideoBytes, 100 * 1024 * 1024);
      expect(MediaLimits.maxAudioBytes, 25 * 1024 * 1024);
    });

    test('supports distinct media kinds', () {
      expect(MediaKind.values, contains(MediaKind.image));
      expect(MediaKind.values, contains(MediaKind.video));
      expect(MediaKind.values, contains(MediaKind.audio));
    });
  });

  test('media upload exception preserves the user-facing message', () {
    const error = MediaUploadException('Upload failed.');
    expect(error.message, 'Upload failed.');
    expect(error.toString(), 'Upload failed.');
  });
}
