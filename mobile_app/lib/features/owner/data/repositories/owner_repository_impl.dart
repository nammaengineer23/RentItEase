import '../../domain/entities/activity_entity.dart';
import '../../domain/entities/dashboard_summary_entity.dart';
import '../../domain/entities/owner_property_entity.dart';
import '../../domain/entities/visit_request_entity.dart';
import '../../domain/repositories/owner_repository.dart';
import '../api/owner_api.dart';

class OwnerRepositoryImpl implements OwnerRepository {
  OwnerRepositoryImpl(this._api);

  final OwnerApi _api;

  // ==========================================================
  // Dashboard
  // ==========================================================

  @override
  Future<DashboardSummaryEntity> getDashboardSummary() {
    return _api.getDashboardSummary();
  }

  @override
  Future<List<ActivityEntity>> getRecentActivities() {
    return _api.getRecentActivities();
  }

  // ==========================================================
  // Analytics
  // ==========================================================

  @override
  Future<dynamic> getAnalytics() {
    return _api.getAnalytics();
  }

  // ==========================================================
  // Properties
  // ==========================================================

  @override
  Future<List<OwnerPropertyEntity>> getMyProperties() async {
    final properties = await _api.getMyProperties();

    return properties.toList();
  }

  @override
  Future<OwnerPropertyEntity> getProperty(String propertyId) {
    return _api.getProperty(propertyId);
  }

  @override
  Future<OwnerPropertyEntity> addProperty(
    OwnerPropertyEntity property, {
    required double area,
    required int bathrooms,
    required int bedrooms,
    required String country,
    required String furnishing,
    String? landmark,
    double? latitude,
    double? longitude,
    required bool parking,
    required bool petFriendly,
    required String pincode,
    required double securityDeposit,
    required String stateName,
    bool dailyRentEnabled = false,
    double? dailyRent,
    required bool termsAccepted,
    required bool socialMediaConsent,
    required List<String> socialMediaPlatforms,
  }) {
    return _api.addProperty({
      'title': property.title,
      'description': property.description,
      'price': property.rent,
      'address': property.address,
      'locality': property.locality,
      'landmark': landmark,
      'city': property.city,
      'state': stateName,
      'country': country,
      'pincode': pincode,
      'latitude': latitude,
      'longitude': longitude,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'area': area,
      'propertyType': _propertyTypeToApi(property.propertyType),
      'furnishing': _furnishingToApi(furnishing),
      'parking': parking,
      'petFriendly': petFriendly,
      'securityDeposit': securityDeposit,
      'dailyRentEnabled': dailyRentEnabled,
      if (dailyRentEnabled) 'dailyRent': dailyRent,
      'termsAccepted': termsAccepted,
      'termsVersion': '1.0',
      'socialMediaConsent': socialMediaConsent,
      if (socialMediaConsent) 'socialMediaPlatforms': socialMediaPlatforms,
    });
  }

  @override
  Future<void> updateProperty(
    OwnerPropertyEntity property, {
    required double area,
    required int bathrooms,
    required int bedrooms,
    required String country,
    required String furnishing,
    String? landmark,
    double? latitude,
    double? longitude,
    required bool parking,
    required bool petFriendly,
    required String pincode,
    required double securityDeposit,
    required String stateName,
    bool dailyRentEnabled = false,
    double? dailyRent,
  }) {
    return _api.updateProperty(property.id, {
      'title': property.title,
      'description': property.description,
      'price': property.rent,
      'address': property.address,
      'locality': property.locality,
      'landmark': landmark,
      'city': property.city,
      'state': stateName,
      'country': country,
      'pincode': pincode,
      'latitude': latitude,
      'longitude': longitude,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'area': area,
      'propertyType': _propertyTypeToApi(property.propertyType),
      'furnishing': _furnishingToApi(furnishing),
      'parking': parking,
      'petFriendly': petFriendly,
      'securityDeposit': securityDeposit,
      'isAvailable': property.isAvailable,
      'dailyRentEnabled': dailyRentEnabled,
      'dailyRent': dailyRentEnabled ? dailyRent : null,
    });
  }

  @override
  Future<void> deleteProperty(String propertyId) {
    return _api.deleteProperty(propertyId);
  }

  // ==========================================================
  // Visit Requests
  // ==========================================================

  @override
  Future<List<VisitRequestEntity>> getVisitRequests() {
    return _api.getVisitRequests();
  }

  @override
  Future<void> approveVisit(String visitId) {
    return _api.approveVisit(visitId);
  }

  @override
  Future<void> rejectVisit(String visitId) {
    return _api.rejectVisit(visitId);
  }

  @override
  Future<void> completeVisit(String visitId) {
    return _api.completeVisit(visitId);
  }

  // ==========================================================
  // Helpers
  // ==========================================================

  String _propertyTypeToApi(String value) {
    switch (value.trim().toLowerCase()) {
      case 'apartment':
        return 'APARTMENT';

      case 'house':
      case 'independent house':
        return 'HOUSE';

      case 'villa':
        return 'VILLA';

      case 'studio':
        return 'STUDIO';

      case 'room':
        return 'ROOM';

      case 'pg':
        return 'PG';

      default:
        return value.toUpperCase();
    }
  }

  String _furnishingToApi(String value) {
    switch (value.trim().toLowerCase()) {
      case 'unfurnished':
        return 'UNFURNISHED';

      case 'semi furnished':
      case 'semi_furnished':
        return 'SEMI_FURNISHED';

      case 'fully furnished':
      case 'fully_furnished':
        return 'FULLY_FURNISHED';

      default:
        return value.toUpperCase();
    }
  }
}
