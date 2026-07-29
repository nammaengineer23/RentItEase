import '../models/owner_property_model.dart';
import '../models/visit_request_model.dart';
import '../models/analytics_model.dart';

import 'owner_api.dart';

class OwnerRepository {
  final OwnerApi api;

  OwnerRepository(this.api);

  // ==========================
  // PROPERTY METHODS
  // ==========================

  Future<List<OwnerPropertyModel>> getMyProperties() async {
    return await api.getMyProperties();
  }

  Future<OwnerPropertyModel> createProperty(Map<String, dynamic> data) async {
    return await api.createProperty(data);
  }

  Future<OwnerPropertyModel> updateProperty(
    String id,

    Map<String, dynamic> data,
  ) async {
    return await api.updateProperty(id, data);
  }

  Future<void> deleteProperty(String id) async {
    await api.deleteProperty(id);
  }

  // ==========================
  // VISIT METHODS
  // ==========================

  Future<List<VisitRequestModel>> getOwnerVisits() async {
    return await api.getOwnerVisits();
  }

  Future<void> approveVisit(String id) async {
    await api.approveVisit(id);
  }

  Future<void> rejectVisit(String id) async {
    await api.rejectVisit(id);
  }

  Future<void> completeVisit(String id) async {
    await api.completeVisit(id);
  }

  // ==========================
  // ANALYTICS METHODS
  // ==========================

  Future<AnalyticsModel> getAnalytics() async {
    return await api.getAnalytics();
  }
}
