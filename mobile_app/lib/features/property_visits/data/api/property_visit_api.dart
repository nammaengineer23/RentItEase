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
    final response = await _dio.get<Map<String, dynamic>>(_basePath);

    final data = response.data;

    if (data == null) {
      throw Exception('Empty property visits response.');
    }

    final visits = data['visits'];

    if (visits is! List) {
      throw Exception('Invalid property visits response.');
    }

    return visits
        .whereType<Map>()
        .map(
          (e) => PropertyVisitModel.fromJson(
            Map<String, dynamic>.from(e),
          ),
        )
        .toList();
  }

  // ==========================================================
  // Owner Visits
  // ==========================================================

  Future<List<PropertyVisitModel>> getOwnerVisits() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '$_basePath/owner',
    );

    final data = response.data;

    if (data == null) {
      throw Exception('Empty owner visits response.');
    }

    final visits = data['visits'];

    if (visits is! List) {
      throw Exception('Invalid owner visits response.');
    }

    return visits
        .whereType<Map>()
        .map(
          (e) => PropertyVisitModel.fromJson(
            Map<String, dynamic>.from(e),
          ),
        )
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
    if (propertyId.trim().isEmpty) {
      throw Exception('Property ID is required.');
    }

    if (!visitDate.isAfter(DateTime.now())) {
      throw Exception('Visit date must be in the future.');
    }

    final response = await _dio.post<Map<String, dynamic>>(
      _basePath,
      data: {
        'propertyId': propertyId.trim(),
        'visitDate': visitDate.toUtc().toIso8601String(),
        if (notes != null && notes.trim().isNotEmpty)
          'notes': notes.trim(),
      },
    );

    final data = response.data;

    if (data == null) {
      throw Exception('Empty visit booking response.');
    }

    if (data['success'] != true) {
      throw Exception(
        data['message']?.toString() ??
            'Unable to book property visit.',
      );
    }
  }

  // ==========================================================
  // Cancel Visit
  // ==========================================================

  Future<void> cancelVisit(String visitId) async {
    if (visitId.trim().isEmpty) {
      throw Exception('Visit ID is required.');
    }

    await _dio.patch(
      '$_basePath/${visitId.trim()}/cancel',
    );
  }

  // ==========================================================
  // Owner: Approve Visit
  // ==========================================================

  Future<void> approveVisit(String visitId) async {
    if (visitId.trim().isEmpty) {
      throw Exception('Visit ID is required.');
    }

    await _dio.patch(
      '$_basePath/${visitId.trim()}/approve',
    );
  }

  // ==========================================================
  // Owner: Reject Visit
  // ==========================================================

  Future<void> rejectVisit(String visitId) async {
    if (visitId.trim().isEmpty) {
      throw Exception('Visit ID is required.');
    }

    await _dio.patch(
      '$_basePath/${visitId.trim()}/reject',
    );
  }

  // ==========================================================
  // Owner: Complete Visit
  // ==========================================================

  Future<void> completeVisit(String visitId) async {
    if (visitId.trim().isEmpty) {
      throw Exception('Visit ID is required.');
    }

    await _dio.patch(
      '$_basePath/${visitId.trim()}/complete',
    );
  }
}