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

  return FavoritesRepository(FavoritesApi(dio));
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
    bool clearError = false,
  }) {
    return FavoritesState(
      isLoading: isLoading ?? this.isLoading,
      favorites: favorites ?? this.favorites,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ======================================================
// Notifier
// ======================================================

class FavoritesNotifier extends StateNotifier<FavoritesState> {
  FavoritesNotifier(this._repository) : super(const FavoritesState());

  final FavoritesRepository _repository;

  // ====================================================
  // Load Favorites
  // ====================================================

  Future<bool> loadFavorites() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final favorites = await _repository.getFavorites();

      state = state.copyWith(
        isLoading: false,
        favorites: favorites,
        clearError: true,
      );

      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());

      return false;
    }
  }

  // ====================================================
  // Add Favorite
  // ====================================================

  Future<bool> addFavorite(String propertyId) async {
    state = state.copyWith(clearError: true);

    try {
      await _repository.addFavorite(propertyId);

      // Reload so the state contains the actual
      // favorite returned by the backend.
      return await loadFavorites();
    } catch (e) {
      state = state.copyWith(error: e.toString());

      return false;
    }
  }

  // ====================================================
  // Remove Favorite
  // ====================================================

  Future<bool> removeFavorite(String propertyId) async {
    state = state.copyWith(clearError: true);

    try {
      await _repository.removeFavorite(propertyId);

      // Reload to keep Favorites Page synchronized.
      return await loadFavorites();
    } catch (e) {
      state = state.copyWith(error: e.toString());

      return false;
    }
  }

  // ====================================================
  // Check Favorite From Current State
  // ====================================================

  bool isFavorite(String propertyId) {
    return state.favorites.any((favorite) => favorite.propertyId == propertyId);
  }

  // ====================================================
  // Check Favorite From Backend
  // ====================================================

  Future<bool> checkFavorite(String propertyId) async {
    try {
      return await _repository.isFavorite(propertyId);
    } catch (e) {
      state = state.copyWith(error: e.toString());

      return false;
    }
  }

  // ====================================================
  // Refresh
  // ====================================================

  Future<bool> refresh() {
    return loadFavorites();
  }

  // ====================================================
  // Clear Error
  // ====================================================

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// ======================================================
// Provider
// ======================================================

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, FavoritesState>((ref) {
      final repository = ref.watch(favoritesRepositoryProvider);

      return FavoritesNotifier(repository);
    });
