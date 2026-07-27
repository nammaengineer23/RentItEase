import '../../domain/entities/settings_entity.dart';
import '../../domain/repositories/settings_repository.dart';

class SettingsRepositoryImpl implements SettingsRepository {
  @override
  Future<List<SettingsEntity>> load() async {
    return [
      const SettingsEntity('Track progress', 'Built for RentEase workflows.'),
    ];
  }
}
