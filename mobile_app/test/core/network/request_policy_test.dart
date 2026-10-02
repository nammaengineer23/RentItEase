import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/core/network/request_policy.dart';

void main() {
  group('RequestPolicy', () {
    test('allows refresh retry for idempotent reads', () {
      expect(RequestPolicy.canRetryAfterRefresh('GET'), isTrue);
      expect(RequestPolicy.canRetryAfterRefresh('head'), isTrue);
      expect(RequestPolicy.canRetryAfterRefresh('OPTIONS'), isTrue);
    });

    test('does not retry mutating operations after refresh', () {
      for (final method in ['POST', 'PUT', 'PATCH', 'DELETE']) {
        expect(RequestPolicy.canRetryAfterRefresh(method), isFalse);
      }
    });

    test('rejects blank or unknown methods', () {
      expect(RequestPolicy.canRetryAfterRefresh(''), isFalse);
      expect(RequestPolicy.canRetryAfterRefresh('CONNECT'), isFalse);
    });
  });
}
