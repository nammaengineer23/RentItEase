import '../../domain/entities/home_entity.dart';
import '../../domain/repositories/home_repository.dart';

class HomeRepositoryImpl implements HomeRepository
{
  @override
  Future<List<HomeEntity>> load() async
{
    return [
      const HomeEntity('Track progress', 'Built for RentItEase workflows.'),
    ];
  }
}
