import 'package:dio/dio.dart';

import '../models/property_visit_model.dart';

class PropertyVisitApi {
  PropertyVisitApi(this._dio);

  final Dio _dio;

  static const String _basePath = '/property-visits';

  // ==========================================================
  // Tenant Visits
  // ==========================================================

  Future<List<PropertyVisitModel>> getMyVisits() async {
    final response = await _dio.get(_basePath);

    final data = response.data as Map<String, dynamic>;

    final visits = data['visits'] as List<dynamic>? ?? [];

    return visits
        .map((e) => PropertyVisitModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ==========================================================
  // Owner Visits
  // ==========================================================

  Future<List<PropertyVisitModel>> getOwnerVisits() async {
    final response = await _dio.get('$_basePath/owner');

    final data = response.data as Map<String, dynamic>;

    final visits = data['visits'] as List<dynamic>? ?? [];

    return visits
        .map((e) => PropertyVisitModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ==========================================================
  // Book Visit
  // ==========================================================

  Future<void> bookVisit({
    required String propertyId,
    required DateTime visitDate,
    String? notes,
  }) async {
    await _dio.post(
      _basePath,
      data: {
        'propertyId': propertyId,
        'visitDate': visitDate.toIso8601String(),
        if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      },
    );
  }

  // ==========================================================
  // Cancel Visit
  // ==========================================================

  Future<void> cancelVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/cancel');
  }

  // ==========================================================
  // Owner: Approve Visit
  // ==========================================================

  Future<void> approveVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/approve');
  }

  // ==========================================================
  // Owner: Reject Visit
  // ==========================================================

  Future<void> rejectVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/reject');
  }

  // ==========================================================
  // Owner: Complete Visit
  // ==========================================================

  Future<void> completeVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/complete');
  }
}
