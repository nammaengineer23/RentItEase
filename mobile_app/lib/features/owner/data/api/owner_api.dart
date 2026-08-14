import 'package:dio/dio.dart';

import '../models/activity_model.dart';
import '../models/analytics_model.dart';
import '../models/owner_property_model.dart';
import '../models/visit_request_model.dart';
import '../models/dashboard_summary_model.dart';

class OwnerApi {
  OwnerApi(this._dio);

  final Dio _dio;

  // ==========================================================
  // Dashboard
  // ==========================================================

  Future<DashboardSummaryModel> getDashboardSummary() async {
    final response = await _dio.get('/owner/dashboard');

    return DashboardSummaryModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  // ==========================================================
  // Analytics
  // ==========================================================

  Future<AnalyticsModel> getAnalytics() async {
    final response = await _dio.get('/owner/dashboard/analytics');

    return AnalyticsModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  // ==========================================================
  // Recent Activity
  // ==========================================================

  Future<List<ActivityModel>> getRecentActivities() async {
    final response = await _dio.get('/owner/dashboard/activity');

    final data = response.data;

    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map((item) => ActivityModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  // ==========================================================
  // My Properties
  // ==========================================================

  Future<List<OwnerPropertyModel>> getMyProperties() async {
    final response = await _dio.get('/owner/dashboard/properties');

    final data = response.data;

    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map(
          (item) =>
              OwnerPropertyModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  Future<OwnerPropertyModel> getProperty(String propertyId) async {
    final response = await _dio.get('/properties/$propertyId');

    final raw = response.data;

    final data = raw is Map && raw['property'] is Map ? raw['property'] : raw;

    return OwnerPropertyModel.fromJson(Map<String, dynamic>.from(data as Map));
  }

  // ==========================================================
  // Property CRUD
  // ==========================================================

  Future<OwnerPropertyModel> addProperty(Map<String, dynamic> body) async {
    final response = await _dio.post('/properties', data: body);

    final raw = response.data;

    final data = raw is Map && raw['property'] is Map ? raw['property'] : raw;

    return OwnerPropertyModel.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<OwnerPropertyModel> updateProperty(
    String propertyId,
    Map<String, dynamic> body,
  ) async {
    final response = await _dio.patch('/properties/$propertyId', data: body);

    final raw = response.data;

    final data = raw is Map && raw['property'] is Map ? raw['property'] : raw;

    return OwnerPropertyModel.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> deleteProperty(String propertyId) async {
    await _dio.delete('/properties/$propertyId');
  }

  // ==========================================================
  // Visit Requests
  // ==========================================================

  Future<List<VisitRequestModel>> getVisitRequests() async {
    final response = await _dio.get('/property-visits/owner');

    final data = response.data;

    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map(
          (item) => VisitRequestModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  Future<void> approveVisit(String visitId) async {
    await _dio.patch('/property-visits/$visitId/approve');
  }

  Future<void> rejectVisit(String visitId) async {
    await _dio.patch('/property-visits/$visitId/reject');
  }

  Future<void> completeVisit(String visitId) async {
    await _dio.patch('/property-visits/$visitId/complete');
  }
}
