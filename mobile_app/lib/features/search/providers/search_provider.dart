import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/search_entity.dart';
import '../domain/repositories/search_repository.dart';
import '../data/repositories/search_repository_impl.dart';

final _repositoryProvider = Provider<SearchRepository>(
  (ref) => SearchRepositoryImpl(),
);

final searchProvider = FutureProvider<List<SearchEntity>>((ref) async {
  final repository = ref.read(_repositoryProvider);
  return repository.load();
});
