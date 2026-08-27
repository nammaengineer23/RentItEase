import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/network/response_envelope.dart';

void main() {
  group('response envelope parsing', () {
    test('unwraps nested settings data', () {
      final result = unwrapResponseMap({
        'success': true,
        'data': {
          'pushNotifications': false,
          'darkMode': true,
        },
      });

      expect(result['pushNotifications'], isFalse);
      expect(result['darkMode'], isTrue);
    });

    test('unwraps property visits by key', () {
      final result = unwrapResponseList({
        'success': true,
        'data': {
          'success': true,
          'visits': [
            {'id': 'visit-1'},
          ],
        },
      }, keys: const ['visits']);

      expect(result.single['id'], 'visit-1');
    });

    test('unwraps bookings by key', () {
      final result = unwrapResponseList({
        'success': true,
        'data': {
          'bookings': [
            {'id': 'booking-1'},
          ],
        },
      }, keys: const ['bookings']);

      expect(result.single['id'], 'booking-1');
    });
  });
}
