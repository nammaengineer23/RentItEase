import '../entities/search_entity.dart';
import '../../data/models/search_model.dart';

abstract class SearchRepository {
  /// Search properties using filters
  Future<List<SearchModel>> search(SearchEntity filters);

  /// Load recent searches
  Future<List<SearchModel>> recentSearches();
}
