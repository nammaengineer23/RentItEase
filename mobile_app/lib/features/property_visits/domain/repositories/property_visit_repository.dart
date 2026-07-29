import '../entities/property_visit.dart';

abstract class PropertyVisitRepository {
  /// Tenant

  Future<List<PropertyVisit>> getMyVisits();

  Future<void> bookVisit({
    required String propertyId,
    required DateTime visitDate,
    String? notes,
  });

  Future<void> cancelVisit(String visitId);

  /// Owner

  Future<List<PropertyVisit>> getOwnerVisits();

  Future<void> approveVisit(String visitId);

  Future<void> rejectVisit(String visitId);

  Future<void> completeVisit(String visitId);
}
