import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../property/domain/entities/property_entity.dart';
import '../data/repositories/search_repository_impl.dart';
import '../data/search_api.dart';
import '../domain/entities/search_entity.dart';
import '../domain/repositories/search_repository.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepositoryImpl(SearchApi(ref.watch(dioProvider)));
});

class SearchState {
  const SearchState({
    this.isLoading = false,
    this.results = const [],
    this.error,
    this.filters = const SearchEntity(),
    this.hasMore = true,
  });

  final bool isLoading;
  final List<PropertyEntity> results;
  final String? error;
  final SearchEntity filters;
  final bool hasMore;

  SearchState copyWith({
    bool? isLoading,
    List<PropertyEntity>? results,
    String? error,
    SearchEntity? filters,
    bool? hasMore,
  }) {
    return SearchState(
      isLoading: isLoading ?? this.isLoading,
      results: results ?? this.results,
      error: error,
      filters: filters ?? this.filters,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class SearchNotifier extends StateNotifier<SearchState> {
  SearchNotifier(this._repository) : super(const SearchState());

  final SearchRepository _repository;

  Future<void> search(SearchEntity filters) async {
    state = state.copyWith(isLoading: true, error: null, filters: filters);

    try {
      final results = await _repository.search(filters);
      state = state.copyWith(
        isLoading: false,
        results: results,
        error: null,
        hasMore: results.length == filters.limit,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        results: const [],
        error: error.toString(),
      );
    }
  }

  Future<void> loadRecentSearches() async {
    final results = await _repository.recentSearches();
    state = state.copyWith(results: results, error: null);
  }

  Future<void> refresh() => search(state.filters);

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    final next = state.filters.copyWith(page: state.filters.page + 1);
    state = state.copyWith(isLoading: true, error: null);
    try {
      final results = await _repository.search(next);
      state = state.copyWith(
        isLoading: false,
        results: [...state.results, ...results],
        filters: next,
        hasMore: results.length == next.limit,
        error: null,
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
    }
  }

  void showNearby(List<PropertyEntity> properties) {
    state = state.copyWith(
      isLoading: false,
      results: properties,
      error: null,
      filters: const SearchEntity(),
      hasMore: false,
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>((ref) {
  return SearchNotifier(ref.watch(searchRepositoryProvider));
});
