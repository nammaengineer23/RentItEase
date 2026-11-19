import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile_app/features/property/data/cache/property_cache.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PropertyCache signed media URL lifetime', () {
    test('discards persisted feed after the signed URL safety window', () async {
      SharedPreferences.setMockInitialValues({
        'property_feed_cache_v1': '[]',
        'property_feed_cache_updated_at_v1': DateTime.now()
            .toUtc()
            .subtract(const Duration(minutes: 46))
            .toIso8601String(),
      });

      final properties = await PropertyCache().readProperties();
      final preferences = await SharedPreferences.getInstance();

      expect(properties, isEmpty);
      expect(preferences.containsKey('property_feed_cache_v1'), isFalse);
      expect(
        preferences.containsKey('property_feed_cache_updated_at_v1'),
        isFalse,
      );
    });

    test('discards cache with missing timestamp', () async {
      SharedPreferences.setMockInitialValues({
        'property_feed_cache_v1': '[]',
      });

      final properties = await PropertyCache().readProperties();
      final preferences = await SharedPreferences.getInstance();

      expect(properties, isEmpty);
      expect(preferences.containsKey('property_feed_cache_v1'), isFalse);
    });
  });
}
