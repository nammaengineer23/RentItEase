import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/home_entity.dart';
import '../domain/repositories/home_repository.dart';
import '../data/repositories/home_repository_impl.dart';

final _repositoryProvider = Provider<HomeRepository>(
  (ref) => HomeRepositoryImpl(),
);

final homeProvider = FutureProvider<List<HomeEntity>>((ref) async {
  final repository = ref.read(_repositoryProvider);
  return repository.load();
});
