import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/favorites_api.dart';
import '../data/favorites_repository.dart';
import '../../../core/network/dio_provider.dart';
import '../models/favorite_property_model.dart';

// ==================================
// Repository Provider
// ==================================

final favoritesRepositoryProvider = Provider<FavoritesRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return FavoritesRepository(FavoritesApi(dio));
});

// ==================================
// Favorites State
// ==================================

class FavoritesState {
  final bool isLoading;

  final List<FavoritePropertyModel> favorites;

  final String? error;

  FavoritesState({
    this.isLoading = false,

    this.favorites = const [],

    this.error,
  });

  FavoritesState copyWith({
    bool? isLoading,

    List<FavoritePropertyModel>? favorites,

    String? error,
  }) {
    return FavoritesState(
      isLoading: isLoading ?? this.isLoading,

      favorites: favorites ?? this.favorites,

      error: error ?? this.error,
    );
  }
}

// ==================================
// Favorites Notifier
// ==================================

class FavoritesNotifier extends StateNotifier<FavoritesState> {
  final FavoritesRepository repository;

  FavoritesNotifier(this.repository) : super(FavoritesState());

  // ================================
  // LOAD FAVORITES
  // ================================

  Future<void> loadFavorites() async {
    state = state.copyWith(isLoading: true);

    try {
      final data = await repository.getFavorites();

      state = state.copyWith(isLoading: false, favorites: data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ================================
  // ADD FAVORITE
  // ================================

  Future<void> addFavorite(String propertyId) async {
    try {
      await repository.addFavorite(propertyId);

      await loadFavorites();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  // ================================
  // REMOVE FAVORITE
  // ================================

  Future<void> removeFavorite(String propertyId) async {
    try {
      await repository.removeFavorite(propertyId);

      await loadFavorites();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

// ==================================
// Provider
// ==================================

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, FavoritesState>((ref) {
      final repository = ref.watch(favoritesRepositoryProvider);

      return FavoritesNotifier(repository);
    });
