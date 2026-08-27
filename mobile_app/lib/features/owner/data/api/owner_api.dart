import 'package:dio/dio.dart';

import '../models/activity_model.dart';
import '../models/analytics_model.dart';
import '../models/dashboard_summary_model.dart';
import '../models/owner_property_model.dart';
import '../models/visit_request_model.dart';

class OwnerApi {
  OwnerApi(this._dio);

  final Dio _dio;

  // ==========================================================
  // Dashboard
  // ==========================================================

  Future<DashboardSummaryModel> getDashboardSummary() async {
    final response = await _dio.get('/owner/dashboard');

    return DashboardSummaryModel.fromJson(_extractMap(response.data));
  }

  // ==========================================================
  // Analytics
  // ==========================================================

  Future<AnalyticsModel> getAnalytics() async {
    final response = await _dio.get('/owner/dashboard/analytics');

    return AnalyticsModel.fromJson(_extractMap(response.data));
  }

  // ==========================================================
  // Recent Activity
  // ==========================================================

  Future<List<ActivityModel>> getRecentActivities() async {
    final response = await _dio.get('/owner/dashboard/activity');

    return _extractList(response.data)
        .whereType<Map>()
        .map((item) => ActivityModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  // ==========================================================
  // My Properties
  // ==========================================================

  Future<List<OwnerPropertyModel>> getMyProperties() async {
    final response = await _dio.get('/owner/dashboard/properties');

    return _extractList(response.data)
        .whereType<Map>()
        .map(
          (item) =>
              OwnerPropertyModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  Future<OwnerPropertyModel> getProperty(String propertyId) async {
    final response = await _dio.get('/properties/$propertyId');

    return OwnerPropertyModel.fromJson(
      _extractMap(response.data, nestedKey: 'property'),
    );
  }

  // ==========================================================
  // Property CRUD
  // ==========================================================

  Future<OwnerPropertyModel> addProperty(Map<String, dynamic> body) async {
    final response = await _dio.post('/properties', data: body);

    return OwnerPropertyModel.fromJson(
      _extractMap(response.data, nestedKey: 'property'),
    );
  }

  Future<OwnerPropertyModel> updateProperty(
    String propertyId,
    Map<String, dynamic> body,
  ) async {
    final response = await _dio.patch('/properties/$propertyId', data: body);

    return OwnerPropertyModel.fromJson(
      _extractMap(response.data, nestedKey: 'property'),
    );
  }

  Future<void> deleteProperty(String propertyId) async {
    await _dio.delete('/properties/$propertyId');
  }

  // ==========================================================
  // Visit Requests
  // ==========================================================

  Future<List<VisitRequestModel>> getVisitRequests() async {
    final response = await _dio.get('/property-visits/owner');

    return _extractList(response.data)
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

  // ==========================================================
  // RESPONSE HELPERS
  // ==========================================================

  dynamic _unwrap(dynamic value) {
    var current = value;

    // Supports responses such as:
    //
    // {
    //   "success": true,
    //   "data": {...}
    // }
    //
    // and nested data wrappers.
    while (current is Map && current['data'] != null) {
      current = current['data'];
    }

    return current;
  }

  Map<String, dynamic> _extractMap(dynamic value, {String? nestedKey}) {
    final unwrapped = _unwrap(value);

    final dynamic candidate;

    if (nestedKey != null && unwrapped is Map && unwrapped[nestedKey] is Map) {
      candidate = unwrapped[nestedKey];
    } else {
      candidate = unwrapped;
    }

    if (candidate is! Map) {
      throw const FormatException('Expected an object from the owner API.');
    }

    return Map<String, dynamic>.from(candidate);
  }

  List<dynamic> _extractList(dynamic value) {
    final unwrapped = _unwrap(value);

    if (unwrapped is List) {
      return List<dynamic>.from(unwrapped);
    }

    if (unwrapped is Map) {
      for (final key in const ['items', 'properties', 'activities', 'visits']) {
        final candidate = unwrapped[key];

        if (candidate is List) {
          return List<dynamic>.from(candidate);
        }
      }
    }

    return const [];
  }
}
