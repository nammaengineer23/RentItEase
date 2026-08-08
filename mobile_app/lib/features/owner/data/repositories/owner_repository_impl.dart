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
  Future<void> addProperty(OwnerPropertyEntity property) {
    return _api.addProperty({
      'title': property.title,
      'city': property.city,
      'locality': property.locality,
      'rent': property.rent,
      'imageUrl': property.imageUrl,
      'isAvailable': property.isAvailable,
      'isVerified': property.isVerified,
    });
  }

  @override
  Future<void> updateProperty(OwnerPropertyEntity property) {
    return _api.updateProperty(property.id, {
      'title': property.title,
      'city': property.city,
      'locality': property.locality,
      'rent': property.rent,
      'imageUrl': property.imageUrl,
      'isAvailable': property.isAvailable,
      'isVerified': property.isVerified,
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
}
