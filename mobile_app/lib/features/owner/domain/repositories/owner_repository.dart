import '../entities/activity_entity.dart';
import '../entities/dashboard_summary_entity.dart';
import '../entities/owner_property_entity.dart';
import '../entities/visit_request_entity.dart';

abstract class OwnerRepository {
  // ==========================================================
  // Dashboard
  // ==========================================================

  Future<DashboardSummaryEntity> getDashboardSummary();

  Future<List<ActivityEntity>> getRecentActivities();

  // ==========================================================
  // Analytics
  // ==========================================================

  Future<dynamic> getAnalytics();

  // ==========================================================
  // Properties
  // ==========================================================

  Future<List<OwnerPropertyEntity>> getMyProperties();

  Future<OwnerPropertyEntity> getProperty(String propertyId);

  Future<void> addProperty(
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
  });

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
  });

  Future<void> deleteProperty(String propertyId);

  // ==========================================================
  // Visit Requests
  // ==========================================================

  Future<List<VisitRequestEntity>> getVisitRequests();

  Future<void> approveVisit(String visitId);

  Future<void> rejectVisit(String visitId);

  Future<void> completeVisit(String visitId);
}
