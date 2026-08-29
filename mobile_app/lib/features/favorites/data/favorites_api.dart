import 'package:dio/dio.dart';

import '../models/favorite_property_model.dart';

class FavoritesApi {
  FavoritesApi(this.dio);

  final Dio dio;

  // ==================================================
  // Get Favorite Properties
  // ==================================================

  Future<List<FavoritePropertyModel>> getFavorites() async {
    try {
      final response = await dio.get('/favorites');

      final list = _extractList(response.data);

      return list
          .whereType<Map>()
          .map(
            (item) =>
                FavoritePropertyModel.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(_errorMessage(e, 'Failed to load favorites'));
    }
  }

  // ==================================================
  // Add Favorite
  // ==================================================

  Future<void> addFavorite(String propertyId) async {
    try {
      await dio.post('/favorites/$propertyId');
    } on DioException catch (e) {
      throw Exception(_errorMessage(e, 'Failed to add favorite'));
    }
  }

  // ==================================================
  // Remove Favorite
  // ==================================================

  Future<void> removeFavorite(String propertyId) async {
    try {
      await dio.delete('/favorites/$propertyId');
    } on DioException catch (e) {
      throw Exception(_errorMessage(e, 'Failed to remove favorite'));
    }
  }

  // ==================================================
  // Check Favorite
  // ==================================================

  Future<bool> isFavorite(String propertyId) async {
    try {
      final response = await dio.get('/favorites/check/$propertyId');

      final data = _extractMap(response.data);

      if (data is Map<String, dynamic>) {
        return data['isFavorite'] == true;
      }

      return false;
    } on DioException catch (e) {
      throw Exception(_errorMessage(e, 'Failed to check favorite'));
    }
  }

  // ==================================================
  // Error Message
  // ==================================================

  String _errorMessage(DioException error, String fallback) {
    final responseData = error.response?.data;

    if (responseData is Map<String, dynamic>) {
      dynamic value = responseData;
      for (var depth = 0; depth < 5; depth++) {
        if (value is! Map || !value.containsKey('data')) break;
        value = value['data'];
      }
      final map = value is Map ? value : responseData;
      final message = map['message'] ?? responseData['message'];

      if (message is String && message.isNotEmpty) {
        return message;
      }

      final errorMessage = map['error'] ?? responseData['error'];

      if (errorMessage is String && errorMessage.isNotEmpty) {
        return errorMessage;
      }
    }

    return error.response?.statusMessage ?? fallback;
  }

  static List<dynamic> _extractList(dynamic response) {
    dynamic value = response;
    for (var depth = 0; depth < 5; depth++) {
      if (value is List) return value;
      if (value is! Map) break;
      if (value['favorites'] is List) return value['favorites'] as List;
      if (!value.containsKey('data')) break;
      value = value['data'];
    }
    return const [];
  }

  static Map<String, dynamic> _extractMap(dynamic response) {
    dynamic value = response;
    for (var depth = 0; depth < 5; depth++) {
      if (value is! Map) return const {};
      final map = Map<String, dynamic>.from(value);
      if (map.containsKey('isFavorite')) return map;
      if (!map.containsKey('data')) return map;
      value = map['data'];
    }
    return value is Map ? Map<String, dynamic>.from(value) : const {};
  }
}
