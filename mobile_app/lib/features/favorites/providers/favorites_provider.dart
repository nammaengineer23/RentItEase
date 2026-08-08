import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/favorites_api.dart';
import '../data/favorites_repository.dart';
import '../models/favorite_property_model.dart';

// ======================================================
// Repository Provider
// ======================================================

final favoritesRepositoryProvider = Provider<FavoritesRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return FavoritesRepository(
    FavoritesApi(dio),
  );
});

// ======================================================
// State
// ======================================================

class FavoritesState {
  const FavoritesState({
    this.isLoading = false,
    this.favorites = const [],
    this.error,
  });

  final bool isLoading;
  final List<FavoritePropertyModel> favorites;
  final String? error;

  FavoritesState copyWith({
    bool? isLoading,
    List<FavoritePropertyModel>? favorites,
    String? error,
  }) {
    return FavoritesState(
      isLoading: isLoading ?? this.isLoading,
      favorites: favorites ?? this.favorites,
      error: error,
    );
  }
}

// ======================================================
// Notifier
// ======================================================

class FavoritesNotifier extends StateNotifier<FavoritesState> {
  FavoritesNotifier(this._repository) : super(const FavoritesState());

  final FavoritesRepository _repository;

  // ======================================================
  // Load Favorites
  // ======================================================

  Future<void> loadFavorites() async {
    state = state.copyWith(
      isLoading: true,
      error: null,
    );

    try {
      final favorites = await _repository.getFavorites();

      state = state.copyWith(
        isLoading: false,
        favorites: favorites,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // ======================================================
  // Add Favorite
  // ======================================================

  Future<void> addFavorite(String propertyId) async {
    try {
      await _repository.addFavorite(propertyId);

      await loadFavorites();
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
      );
    }
  }

  // ======================================================
  // Remove Favorite
  // ======================================================

  Future<void> removeFavorite(String propertyId) async {
    try {
      await _repository.removeFavorite(propertyId);

      await loadFavorites();
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
      );
    }
  }

  // ======================================================
  // Check Favorite
  // ======================================================

  bool isFavorite(String propertyId) {
    return state.favorites.any(
      (favorite) => favorite.id == propertyId,
    );
  }

  // ======================================================
  // Refresh
  // ======================================================

  Future<void> refresh() async {
    await loadFavorites();
  }

  // ======================================================
  // Clear Error
  // ======================================================

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ======================================================
// Provider
// ======================================================

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, FavoritesState>(
  (ref) {
    final repository = ref.watch(favoritesRepositoryProvider);

    return FavoritesNotifier(repository);
  },
);