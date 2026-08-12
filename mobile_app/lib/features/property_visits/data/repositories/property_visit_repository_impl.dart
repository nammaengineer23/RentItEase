import '../../domain/entities/property_visit.dart';
import '../../domain/repositories/property_visit_repository.dart';
import '../api/property_visit_api.dart';

class PropertyVisitRepositoryImpl implements PropertyVisitRepository {
  PropertyVisitRepositoryImpl(this._api);

  final PropertyVisitApi _api;

  @override
  Future<List<PropertyVisit>> getMyVisits() {
    return _api.getMyVisits();
  }

  @override
  Future<List<PropertyVisit>> getOwnerVisits() {
    return _api.getOwnerVisits();
  }

  @override
  Future<void> bookVisit({
    required String propertyId,
    required DateTime visitDate,
    String? notes,
  }) {
    return _api.bookVisit(
      propertyId: propertyId,
      visitDate: visitDate,
      notes: notes,
    );
  }

  @override
  Future<void> cancelVisit(String visitId) {
    return _api.cancelVisit(visitId);
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
