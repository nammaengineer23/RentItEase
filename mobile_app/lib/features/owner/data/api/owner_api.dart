import 'package:dio/dio.dart';

import '../models/activity_model.dart';
import '../models/analytics_model.dart';
import '../models/dashboard_summary_model.dart';
import '../models/owner_property_model.dart';
import '../models/visit_request_model.dart';

class OwnerApi {
  OwnerApi(this._dio);

  final Dio _dio;

  Future<DashboardSummaryModel> getDashboardSummary() async {
    final response = await _dio.get('/owner/dashboard');
    return DashboardSummaryModel.fromJson(_extractMap(response.data));
  }

  Future<AnalyticsModel> getAnalytics() async {
    final response = await _dio.get('/owner/dashboard/analytics');
    return AnalyticsModel.fromJson(_extractMap(response.data));
  }

  Future<List<ActivityModel>> getRecentActivities() async {
    final response = await _dio.get('/owner/dashboard/activity');
    return _extractList(response.data)
        .whereType<Map>()
        .map((item) => ActivityModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

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

  dynamic _unwrap(dynamic value) {
    var current = value;
    while (current is Map && current['data'] != null) {
      current = current['data'];
    }
    return current;
  }

  Map<String, dynamic> _extractMap(
    dynamic value, {
    String? nestedKey,
  }) {
    final unwrapped = _unwrap(value);
    final candidate = nestedKey != null &&
            unwrapped is Map &&
            unwrapped[nestedKey] is Map
        ? unwrapped[nestedKey]
        : unwrapped;

    if (candidate is! Map) {
      throw const FormatException('Expected an object from the owner API.');
    }

    return Map<String, dynamic>.from(candidate);
  }

  List<dynamic> _extractList(dynamic value) {
    final unwrapped = _unwrap(value);

    if (unwrapped is List) {
      return unwrapped;
    }

    if (unwrapped is Map) {
      for (final key in const ['items', 'properties', 'activities', 'visits']) {
        final candidate = unwrapped[key];
        if (candidate is List) {
          return candidate;
        }
      }
    }

    return const [];
  }
}
