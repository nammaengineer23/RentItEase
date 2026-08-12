import '../../domain/entities/search_entity.dart';
import '../../domain/repositories/search_repository.dart';
import '../models/search_model.dart';
import '../search_api.dart';

class SearchRepositoryImpl implements SearchRepository {
  SearchRepositoryImpl(this._api);

  final SearchApi _api;

  @override
  Future<List<SearchModel>> search(SearchEntity filters) async {
    return await _api.searchProperties(filters.query);
  }

  @override
  Future<List<SearchModel>> recentSearches() async {
    return await _api.recentSearches();
  }
}
