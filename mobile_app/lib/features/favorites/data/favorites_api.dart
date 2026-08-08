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

      final data = response.data;

      List<dynamic> list = [];

      if (data is List) {
        list = data;
      } else if (data is Map<String, dynamic>) {
        if (data['favorites'] is List) {
          list = data['favorites'] as List<dynamic>;
        } else if (data['data'] is List) {
          list = data['data'] as List<dynamic>;
        }
      }

      return list
          .whereType<Map>()
          .map(
            (item) => FavoritePropertyModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(
        _errorMessage(
          e,
          'Failed to load favorites',
        ),
      );
    }
  }

  // ==================================================
  // Add Favorite
  // ==================================================

  Future<void> addFavorite(String propertyId) async {
    try {
      await dio.post('/favorites/$propertyId');
    } on DioException catch (e) {
      throw Exception(
        _errorMessage(
          e,
          'Failed to add favorite',
        ),
      );
    }
  }

  // ==================================================
  // Remove Favorite
  // ==================================================

  Future<void> removeFavorite(String propertyId) async {
    try {
      await dio.delete('/favorites/$propertyId');
    } on DioException catch (e) {
      throw Exception(
        _errorMessage(
          e,
          'Failed to remove favorite',
        ),
      );
    }
  }

  // ==================================================
  // Check Favorite
  // ==================================================

  Future<bool> isFavorite(String propertyId) async {
    try {
      final response = await dio.get(
        '/favorites/check/$propertyId',
      );

      final data = response.data;

      if (data is Map<String, dynamic>) {
        return data['isFavorite'] == true;
      }

      return false;
    } on DioException catch (e) {
      throw Exception(
        _errorMessage(
          e,
          'Failed to check favorite',
        ),
      );
    }
  }

  // ==================================================
  // Error Message
  // ==================================================

  String _errorMessage(
    DioException error,
    String fallback,
  ) {
    final responseData = error.response?.data;

    if (responseData is Map<String, dynamic>) {
      final message = responseData['message'];

      if (message is String && message.isNotEmpty) {
        return message;
      }

      final errorMessage = responseData['error'];

      if (errorMessage is String &&
          errorMessage.isNotEmpty) {
        return errorMessage;
      }
    }

    return error.response?.statusMessage ?? fallback;
  }
}