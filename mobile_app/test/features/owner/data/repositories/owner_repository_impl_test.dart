import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/owner/data/api/owner_api.dart';
import 'package:mobile_app/features/owner/data/models/owner_property_model.dart';
import 'package:mobile_app/features/owner/data/repositories/owner_repository_impl.dart';
import 'package:mobile_app/features/owner/domain/entities/owner_property_entity.dart';

class _CapturingOwnerApi extends OwnerApi {
  _CapturingOwnerApi() : super(Dio());

  Map<String, dynamic>? capturedPayload;

  final _response = OwnerPropertyModel.fromJson({
    'id': 'property-1',
    'title': 'Test House',
    'transactionType': 'RENT',
  });

  @override
  Future<OwnerPropertyModel> addProperty(Map<String, dynamic> body) async {
    capturedPayload = body;
    return _response;
  }

  @override
  Future<OwnerPropertyModel> updateProperty(
    String propertyId,
    Map<String, dynamic> body,
  ) async {
    capturedPayload = body;
    return _response;
  }
}

OwnerPropertyEntity _houseRentProperty() {
  return OwnerPropertyEntity(
    id: 'property-1',
    title: 'Test House',
    description: 'Test description',
    address: 'Test address',
    city: 'Bengaluru',
    stateName: 'Karnataka',
    country: 'India',
    pincode: '560001',
    locality: 'Test locality',
    landmark: '',
    latitude: 12.9,
    longitude: 77.6,
    rent: 20000,
    securityDeposit: 40000,
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    propertyType: 'HOUSE',
    furnishing: 'UNFURNISHED',
    parking: true,
    petFriendly: false,
    imageUrl: '',
    isAvailable: false,
    isVerified: false,
    totalViews: 0,
    pendingVisits: 0,
    createdAt: DateTime(2026, 1, 1),
    views: 0,
    favorites: 0,
    visitRequests: 0,
    transactionType: 'RENT',
    // The form entity may carry these values, but House Rent must not
    // serialize them as site-specific API fields.
    landArea: 1200,
    landAreaUnit: 'sq_ft',
  );
}

void main() {
  group('OwnerRepositoryImpl House Rent payload', () {
    late _CapturingOwnerApi api;
    late OwnerRepositoryImpl repository;

    setUp(() {
      api = _CapturingOwnerApi();
      repository = OwnerRepositoryImpl(api);
    });

    test('addProperty sends area without site-specific fields', () async {
      await repository.addProperty(
        _houseRentProperty(),
        area: 1200,
        areaUnit: 'sq_ft',
        bathrooms: 2,
        bedrooms: 2,
        country: 'India',
        furnishing: 'Unfurnished',
        parking: true,
        petFriendly: false,
        pincode: '560001',
        securityDeposit: 40000,
        stateName: 'Karnataka',
      );

      expect(api.capturedPayload, isNotNull);
      expect(api.capturedPayload!['area'], 1200);
      expect(api.capturedPayload!.containsKey('landArea'), isFalse);
      expect(api.capturedPayload!.containsKey('landAreaUnit'), isFalse);
    });

    test('updateProperty sends area without site-specific fields', () async {
      await repository.updateProperty(
        _houseRentProperty(),
        area: 1200,
        areaUnit: 'sq_ft',
        bathrooms: 2,
        bedrooms: 2,
        country: 'India',
        furnishing: 'Unfurnished',
        parking: true,
        petFriendly: false,
        pincode: '560001',
        securityDeposit: 40000,
        stateName: 'Karnataka',
      );

      expect(api.capturedPayload, isNotNull);
      expect(api.capturedPayload!['area'], 1200);
      expect(api.capturedPayload!.containsKey('landArea'), isFalse);
      expect(api.capturedPayload!.containsKey('landAreaUnit'), isFalse);
    });
  });
}
