import '../../../property/domain/entities/property_entity.dart';
import '../entities/search_entity.dart';

abstract class SearchRepository {
  Future<List<PropertyEntity>> search(SearchEntity filters);

  Future<List<PropertyEntity>> recentSearches();
}
