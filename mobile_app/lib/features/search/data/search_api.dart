import 'package:dio/dio.dart';

import '../../property/data/models/property_model.dart';
import '../../property/domain/entities/property_entity.dart';
import '../domain/entities/search_entity.dart';

class SearchApi {
  SearchApi(this._dio);

  final Dio _dio;

  Future<List<PropertyEntity>> searchProperties(SearchEntity filters) async {
    final query = <String, dynamic>{
      if (filters.query.trim().isNotEmpty) 'search': filters.query.trim(),
      if (filters.city?.trim().isNotEmpty == true) 'city': filters.city!.trim(),
      if (filters.locality?.trim().isNotEmpty == true)
        'locality': filters.locality!.trim(),
      if (filters.propertyType?.isNotEmpty == true)
        'propertyType': filters.propertyType,
      if (filters.bedrooms != null) 'bedrooms': filters.bedrooms,
      if (filters.minRent != null) 'minPrice': filters.minRent,
      if (filters.maxRent != null) 'maxPrice': filters.maxRent,
      if (filters.dailyRentEnabled) 'dailyRentEnabled': true,
      if (filters.minDailyRent != null) 'minDailyRent': filters.minDailyRent,
      if (filters.maxDailyRent != null) 'maxDailyRent': filters.maxDailyRent,
      if (filters.availableOnly) 'isAvailable': true,
      if (filters.parking) 'parking': true,
      'sortBy': filters.sortBy == 'price' ? 'price' : 'createdAt',
      'order': filters.sortBy == 'oldest' ? 'asc' : 'desc',
      'page': filters.page,
      'limit': filters.limit,
    };

    try {
      final response = await _dio.get(
        '/properties',
        queryParameters: query,
      );

      dynamic payload = response.data;
      if (payload is Map && payload['data'] is Map) {
        payload = payload['data'];
      }

      final list = payload is List
          ? payload
          : payload is Map && payload['data'] is List
              ? payload['data'] as List
              : const [];

      return list.whereType<Map>().map((item) {
        final json = Map<String, dynamic>.from(item);
        final images = json['images'];
        final owner = json['owner'];

        return PropertyModel.fromJson({
          ...json,
          'rent': json['rent'] ?? json['price'],
          'rating': json['rating'] ?? json['averageRating'],
          'parking': json['parking'] is bool
              ? (json['parking'] == true ? 1 : 0)
              : json['parking'],
          'imageUrls': images is List
              ? images
                  .whereType<Map>()
                  .map((image) => image['imageUrl']?.toString())
                  .whereType<String>()
                  .toList()
              : json['imageUrls'],
          'ownerName': owner is Map ? owner['fullName'] : json['ownerName'],
          'ownerPhone': owner is Map ? owner['phone'] : json['ownerPhone'],
        }).toEntity();
      }).toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data is Map
            ? (e.response?.data['error']?['message'] ??
                    e.response?.data['message'] ??
                    'Failed to search properties.')
                .toString()
            : 'Failed to search properties.',
      );
    }
  }

  Future<List<PropertyEntity>> recentSearches() async => const [];
}
