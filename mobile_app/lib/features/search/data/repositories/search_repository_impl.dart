import '../../../property/domain/entities/property_entity.dart';
import '../../domain/entities/search_entity.dart';
import '../../domain/repositories/search_repository.dart';
import '../search_api.dart';

class SearchRepositoryImpl implements SearchRepository {
  SearchRepositoryImpl(this._api);

  final SearchApi _api;

  @override
  Future<List<PropertyEntity>> search(SearchEntity filters) {
    return _api.searchProperties(filters);
  }

  @override
  Future<List<PropertyEntity>> recentSearches() {
    return _api.recentSearches();
  }
}
