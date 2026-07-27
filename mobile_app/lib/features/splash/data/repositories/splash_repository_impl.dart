import '../../domain/entities/splash_entity.dart';
import '../../domain/repositories/splash_repository.dart';

class SplashRepositoryImpl implements SplashRepository {
  @override
  Future<List<SplashEntity>> load() async {
    return [
      const SplashEntity('Track progress', 'Built for RentEase workflows.'),
    ];
  }
}
