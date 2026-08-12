import 'package:dio/dio.dart';

import 'models/search_model.dart';

class SearchApi {
  SearchApi(this._dio);

  final Dio _dio;

  //=========================================
  // Search Properties
  // GET /properties/search?q=
  //=========================================

  Future<List<SearchModel>> searchProperties(String query) async {
    try {
      final response = await _dio.get(
        '/properties/search',
        queryParameters: {'q': query},
      );

      final data = response.data;

      final list = data is List ? data : data['data'] ?? [];

      return List<SearchModel>.from(list.map((e) => SearchModel.fromJson(e)));
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ?? 'Failed to search properties.',
      );
    }
  }

  //=========================================
  // Recent Searches
  // GET /properties/recent-searches
  //=========================================

  Future<List<SearchModel>> recentSearches() async {
    try {
      final response = await _dio.get('/properties/recent-searches');

      final data = response.data;

      final list = data is List ? data : data['data'] ?? [];

      return List<SearchModel>.from(list.map((e) => SearchModel.fromJson(e)));
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ?? 'Failed to load recent searches.',
      );
    }
  }
}
