import 'package:dio/dio.dart';

import '../models/favorite_property_model.dart';

class FavoritesApi {
  FavoritesApi(this.dio);

  final Dio dio;

  //==================================================
  // Get Favorite Properties
  //==================================================

  Future<List<FavoritePropertyModel>> getFavorites() async {
    try {
      final response = await dio.get('/favorites');

      final data = response.data;

      List<dynamic> list = [];

      if (data is List) {
        list = data;
      } else if (data is Map<String, dynamic>) {
        if (data['data'] is List) {
          list = data['data'] as List<dynamic>;
        } else if (data['favorites'] is List) {
          list = data['favorites'] as List<dynamic>;
        }
      }

      return list
          .map(
            (e) => FavoritePropertyModel.fromJson(
              Map<String, dynamic>.from(e),
            ),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['message'] ??
            e.response?.statusMessage ??
            'Failed to load favorites',
      );
    }
  }

  //==================================================
  // Add Favorite
  //==================================================

  Future<void> addFavorite(String propertyId) async {
    try {
      await dio.post('/favorites/$propertyId');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['message'] ??
            e.response?.statusMessage ??
            'Failed to add favorite',
      );
    }
  }

  //==================================================
  // Remove Favorite
  //==================================================

  Future<void> removeFavorite(String propertyId) async {
    try {
      await dio.delete('/favorites/$propertyId');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['message'] ??
            e.response?.statusMessage ??
            'Failed to remove favorite',
      );
    }
  }

  //==================================================
  // Check Favorite
  //==================================================

  Future<bool> isFavorite(String propertyId) async {
    try {
      final favorites = await getFavorites();

      return favorites.any((e) => e.propertyId == propertyId);
    } catch (_) {
      return false;
    }
  }
}