import 'package:dio/dio.dart';

import '../models/property_visit_model.dart';

class PropertyVisitApi {
  PropertyVisitApi(this._dio);

  final Dio _dio;

  static const String _basePath = '/property-visits';

  Future<List<PropertyVisitModel>> getMyVisits() async {
    final response = await _dio.get(_basePath);

    final data = response.data as List;

    return data
        .map((e) => PropertyVisitModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<PropertyVisitModel>> getOwnerVisits() async {
    final response = await _dio.get('$_basePath/owner');

    final data = response.data as List;

    return data
        .map((e) => PropertyVisitModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

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
        'notes': notes,
      },
    );
  }

  Future<void> cancelVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/cancel');
  }

  Future<void> approveVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/approve');
  }

  Future<void> rejectVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/reject');
  }

  Future<void> completeVisit(String visitId) async {
    await _dio.patch('$_basePath/$visitId/complete');
  }
}