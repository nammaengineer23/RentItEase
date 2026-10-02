import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/maps/services/location_exception.dart';
import 'package:mobile_app/features/maps/services/location_privacy.dart';

void main() {
  group('LocationPrivacy', () {
    test('rounds coordinates before ordinary sharing', () {
      expect(
        LocationPrivacy.roundForSharing(12.97161234),
        12.9716,
      );
      expect(
        LocationPrivacy.roundForSharing(77.59461234),
        77.5946,
      );
    });

    test('rejects non-finite coordinates', () {
      expect(
        () => LocationPrivacy.roundForSharing(double.nan),
        throwsArgumentError,
      );
      expect(
        () => LocationPrivacy.roundForSharing(double.infinity),
        throwsArgumentError,
      );
    });
  });

  group('LocationException', () {
    test('preserves actionable failure categories', () {
      const error = LocationException(
        LocationFailure.permissionPermanentlyDenied,
        'Enable location in settings.',
      );

      expect(error.failure, LocationFailure.permissionPermanentlyDenied);
      expect(error.message, 'Enable location in settings.');
    });
  });
}
