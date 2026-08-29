import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/booking/data/models/booking_model.dart';
import 'package:mobile_app/features/favorites/models/favorite_property_model.dart';

void main() {
  test('booking retains property information from the API relationship', () {
    final booking = BookingModel.fromJson({
      'id': 'booking-1',
      'propertyId': 'property-1',
      'visitId': 'visit-1',
      'monthlyRent': '25000',
      'securityDeposit': '50000',
      'status': 'PAYMENT_PENDING',
      'bookingDate': '2026-08-29T08:00:00.000Z',
      'visit': {'visitDate': '2026-08-30T10:30:00.000Z'},
      'property': {
        'title': 'Verified House',
        'locality': 'HSR Layout',
        'city': 'Bengaluru',
        'owner': {'id': 'owner-1', 'fullName': 'Property Owner'},
        'images': [
          {'imageUrl': 'https://images.rentitease.com/property.jpg'},
        ],
      },
    });

    expect(booking.propertyTitle, 'Verified House');
    expect(booking.location, 'HSR Layout, Bengaluru');
    expect(booking.ownerName, 'Property Owner');
    expect(booking.imageUrl, contains('images.rentitease.com'));
  });

  test('favorite retains its nested property information', () {
    final favorite = FavoritePropertyModel.fromJson({
      'id': 'favorite-1',
      'propertyId': 'property-1',
      'property': {
        'id': 'property-1',
        'title': 'Verified House',
        'description': 'A clean tenant-flow fixture',
        'propertyType': 'HOUSE',
        'bedrooms': 2,
        'price': '25000',
        'securityDeposit': '50000',
        'locality': 'HSR Layout',
        'city': 'Bengaluru',
        'address': 'Sector 1',
        'images': [
          {
            'imageUrl': 'https://images.rentitease.com/favorite.jpg',
            'isPrimary': true,
          },
        ],
      },
    });

    expect(favorite.propertyId, 'property-1');
    expect(favorite.title, 'Verified House');
    expect(favorite.bhk, '2 BHK');
    expect(favorite.location, 'HSR Layout, Bengaluru');
  });
}
