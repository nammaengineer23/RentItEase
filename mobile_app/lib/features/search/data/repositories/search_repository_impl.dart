import '../../domain/entities/search_entity.dart';
import '../../domain/repositories/search_repository.dart';

class SearchRepositoryImpl implements SearchRepository {
  @override
  Future<List<SearchEntity>> load() async {
    return [
      const SearchEntity('Luxury Apartment', 'Downtown, 2 beds, pet-friendly'),
      const SearchEntity('Garden Villa', 'Suburban, 3 beds, private garden'),
      const SearchEntity(
        'Studio Loft',
        'Near transit, furnished, flexible lease',
      ),
    ];
  }
}
