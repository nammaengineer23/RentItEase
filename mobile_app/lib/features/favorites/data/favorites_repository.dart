import '../models/favorite_property_model.dart';
import 'favorites_api.dart';

class FavoritesRepository {
  FavoritesRepository(this._api);

  final FavoritesApi _api;

  // ==================================================
  // Get Favorites
  // ==================================================

  Future<List<FavoritePropertyModel>> getFavorites() {
    return _api.getFavorites();
  }

  // ==================================================
  // Add Favorite
  // ==================================================

  Future<void> addFavorite(String propertyId) {
    return _api.addFavorite(propertyId);
  }

  // ==================================================
  // Remove Favorite
  // ==================================================

  Future<void> removeFavorite(String propertyId) {
    return _api.removeFavorite(propertyId);
  }

  // ==================================================
  // Check Favorite
  // ==================================================

  Future<bool> isFavorite(String propertyId) {
    return _api.isFavorite(propertyId);
  }
}
