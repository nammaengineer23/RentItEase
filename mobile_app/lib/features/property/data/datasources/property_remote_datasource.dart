import 'package:dio/dio.dart';

import '../../../../config/environment.dart';
import '../../../../core/network/api_client.dart';

class PropertyRemoteDataSource {
  PropertyRemoteDataSource({Dio? dio}) : _dio = dio ?? ApiClient.shared.dio;

  final Dio _dio;

  // =========================================
  // Get All Properties
  // =========================================

  Future<List<dynamic>> getProperties({Map<String, dynamic>? query}) async {
    final response = await _dio.get(
      ApiPaths.properties,
      queryParameters: query,
    );

    return _extractList(response.data);
  }

  // =========================================
  // Get Property Details
  // =========================================

  Future<Map<String, dynamic>> getProperty(String id) async {
    final response = await _dio.get('${ApiPaths.properties}/$id');

    return _extractMap(response.data);
  }

  // =========================================
  // Owner Properties
  // =========================================

  Future<List<dynamic>> getMyProperties() async {
    final response = await _dio.get(ApiPaths.myProperties);

    return _extractList(response.data);
  }

  // =========================================
  // Home Properties
  // =========================================

  Future<Map<String, dynamic>> getHomeProperties() async {
    final response = await _dio.get(ApiPaths.homeProperties);

    return _extractMap(response.data);
  }

  // =========================================
  // Nearby Properties
  // =========================================

  Future<List<dynamic>> getNearbyProperties({
    required double latitude,
    required double longitude,
    double radius = 5,
  }) async {
    final response = await _dio.get(
      ApiPaths.nearbyProperties,
      queryParameters: {
        'latitude': latitude,
        'longitude': longitude,
        'radius': radius,
      },
    );

    return _extractList(response.data);
  }

  // =========================================
  // Create Property
  // =========================================

  Future<Map<String, dynamic>> createProperty(Map<String, dynamic> body) async {
    final response = await _dio.post(ApiPaths.properties, data: body);

    return _extractMap(response.data);
  }

  // =========================================
  // Update Property
  // =========================================

  Future<Map<String, dynamic>> updateProperty({
    required String id,
    required Map<String, dynamic> body,
  }) async {
    final response = await _dio.patch('${ApiPaths.properties}/$id', data: body);

    return _extractMap(response.data);
  }

  // =========================================
  // Delete Property
  // =========================================

  Future<void> deleteProperty(String id) async {
    await _dio.delete('${ApiPaths.properties}/$id');
  }

  // =========================================
  // Update Amenities
  // =========================================

  Future<Map<String, dynamic>> updateAmenities({
    required String propertyId,
    required List<String> amenities,
  }) async {
    final response = await _dio.post(
      '${ApiPaths.properties}/$propertyId/amenities',
      data: {'amenities': amenities},
    );

    return _extractMap(response.data);
  }

  // =========================================
  // Helper Methods
  // =========================================

  List<dynamic> _extractList(dynamic data) {
    if (data is List) {
      return data;
    }

    if (data is Map<String, dynamic>) {
      if (data['data'] is List) {
        return List<dynamic>.from(data['data']);
      }

      if (data['results'] is List) {
        return List<dynamic>.from(data['results']);
      }

      if (data['items'] is List) {
        return List<dynamic>.from(data['items']);
      }
    }

    return [];
  }

  Map<String, dynamic> _extractMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data['data'] is Map<String, dynamic>) {
        return Map<String, dynamic>.from(data['data']);
      }

      return Map<String, dynamic>.from(data);
    }

    return {};
  }
}
