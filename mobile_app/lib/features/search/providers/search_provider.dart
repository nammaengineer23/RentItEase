import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

import '../data/models/search_model.dart';
import '../data/search_api.dart';
import '../data/repositories/search_repository_impl.dart';

import '../domain/entities/search_entity.dart';
import '../domain/repositories/search_repository.dart';

//=========================================
// Repository Provider
//=========================================

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return SearchRepositoryImpl(SearchApi(dio));
});

//=========================================
// State
//=========================================

class SearchState {
  final bool isLoading;
  final List<SearchModel> results;
  final String? error;
  final SearchEntity filters;

  const SearchState({
    this.isLoading = false,
    this.results = const [],
    this.error,
    this.filters = const SearchEntity(),
  });

  SearchState copyWith({
    bool? isLoading,
    List<SearchModel>? results,
    String? error,
    SearchEntity? filters,
  }) {
    return SearchState(
      isLoading: isLoading ?? this.isLoading,
      results: results ?? this.results,
      error: error,
      filters: filters ?? this.filters,
    );
  }
}

//=========================================
// Notifier
//=========================================

class SearchNotifier extends StateNotifier<SearchState> {
  SearchNotifier(this._repository) : super(const SearchState());

  final SearchRepository _repository;

  //=========================================
  // Search
  //=========================================

  Future<void> search(SearchEntity filters) async {
    state = state.copyWith(isLoading: true, error: null, filters: filters);

    try {
      final results = await _repository.search(filters);

      state = state.copyWith(isLoading: false, results: results);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  //=========================================
  // Recent Searches
  //=========================================

  Future<void> loadRecentSearches() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final results = await _repository.recentSearches();

      state = state.copyWith(isLoading: false, results: results);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  //=========================================
  // Refresh
  //=========================================

  Future<void> refresh() async {
    await search(state.filters);
  }

  //=========================================
  // Clear Error
  //=========================================

  void clearError() {
    state = state.copyWith(error: null);
  }
}

//=========================================
// Provider
//=========================================

final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>((
  ref,
) {
  return SearchNotifier(ref.watch(searchRepositoryProvider));
});
