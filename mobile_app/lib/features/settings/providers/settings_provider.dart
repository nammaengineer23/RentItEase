import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/settings_entity.dart';
import '../domain/repositories/settings_repository.dart';
import '../data/repositories/settings_repository_impl.dart';

final _repositoryProvider = Provider<SettingsRepository>(
  (ref) => SettingsRepositoryImpl(),
);

final SettingsProvider = FutureProvider<List<SettingsEntity>>((ref) async {
  final repository = ref.read(_repositoryProvider);
  return repository.load();
});
