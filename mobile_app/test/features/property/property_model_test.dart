import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/property/data/models/property_model.dart';

void main() {
  group('PropertyModel review summary', () {
    test('reads the consolidated rating fields', () {
      final property = PropertyModel.fromJson({
        'id': 'property-1',
        'rating': 4.6,
        'reviewCount': 18,
      });

      expect(property.rating, 4.6);
      expect(property.reviewCount, 18);
    });

    test('supports the legacy backend rating fields', () {
      final property = PropertyModel.fromJson({
        'id': 'property-1',
        'averageRating': '4.2',
        'totalReviews': '7',
      });

      expect(property.rating, 4.2);
      expect(property.reviewCount, 7);
    });
  });
}
