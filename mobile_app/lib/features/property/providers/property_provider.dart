import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/cache/property_cache.dart';
import '../data/repositories/property_repository_impl.dart';
import '../domain/entities/property_entity.dart';

final propertyRepositoryProvider = Provider<PropertyRepositoryImpl>(
  (ref) => PropertyRepositoryImpl(),
);

final propertyCacheProvider = Provider<PropertyCache>((ref) => PropertyCache());

class PropertyNotifier extends StateNotifier<AsyncValue<List<PropertyEntity>>> {
  PropertyNotifier(this._repository, this._cache) : super(const AsyncLoading()) {
    loadProperties();
  }

  final PropertyRepositoryImpl _repository;
  final PropertyCache _cache;
  bool _hasUsableData = false;

  //==========================================================
  // Load All Properties - cache first, API refresh second
  //==========================================================

  Future<void> loadProperties({bool showLoading = true}) async {
    if (!_hasUsableData) {
      final cached = await _cache.readProperties();
      if (cached.isNotEmpty) {
        _hasUsableData = true;
        state = AsyncData(cached);
      } else if (showLoading) {
        state = const AsyncLoading();
      }
    }

    try {
      final properties = await _repository.getProperties();
      _hasUsableData = true;
      state = AsyncData(properties);
      await _cache.writeProperties(properties);
    } catch (error, stackTrace) {
      // Cached/current data remains usable when a background refresh fails.
      if (!_hasUsableData) {
        state = AsyncError(error, stackTrace);
      }
    }
  }

  //==========================================================
  // Refresh
  //==========================================================

  Future<void> refresh() async {
    await loadProperties(showLoading: false);
  }

  //==========================================================
  // Property Details
  //==========================================================

  Future<PropertyEntity> getProperty(String id) {
    return _repository.getProperty(id);
  }

  void updateCachedProperty(PropertyEntity property) {
    state.whenData((properties) {
      final updated = [
        for (final item in properties)
          if (item.id == property.id) property else item,
      ];
      _hasUsableData = true;
      state = AsyncData(updated);
      _cache.writeProperties(updated);
    });
  }

  /// Refresh a single card after the details endpoint records a property view.
  Future<void> refreshProperty(String id) async {
    try {
      final property = await _repository.getProperty(id);
      updateCachedProperty(property);
    } catch (_) {
      // Keep the existing list usable if this best-effort card refresh fails.
    }
  }

  //==========================================================
  // Featured
  //==========================================================

  List<PropertyEntity> featuredProperties() {
    return state.maybeWhen(
      data: (properties) => properties.where((e) => e.isFeatured).toList(),
      orElse: () => [],
    );
  }

  //==========================================================
  // Available
  //==========================================================

  List<PropertyEntity> availableProperties() {
    return state.maybeWhen(
      data: (properties) => properties.where((e) => e.isAvailable).toList(),
      orElse: () => [],
    );
  }

  //==========================================================
  // Search
  //==========================================================

  Future<List<PropertyEntity>> searchProperties({
    String? keyword,
    String? city,
    String? locality,
    double? minRent,
    double? maxRent,
    int? bedrooms,
  }) {
    return _repository.searchProperties(
      keyword: keyword,
      city: city,
      locality: locality,
      minRent: minRent,
      maxRent: maxRent,
      bedrooms: bedrooms,
    );
  }

  //==========================================================
  // Owner Properties
  //==========================================================

  Future<List<PropertyEntity>> getMyProperties() {
    return _repository.getMyProperties();
  }

  //==========================================================
  // Nearby
  //==========================================================

  Future<List<PropertyEntity>> getNearbyProperties({
    required double latitude,
    required double longitude,
    double radius = 5,
  }) {
    return _repository.getNearbyProperties(
      latitude: latitude,
      longitude: longitude,
      radius: radius,
    );
  }

  //==========================================================
  // Create
  //==========================================================

  Future<void> addProperty(Map<String, dynamic> data) async {
    await _repository.createProperty(data);
    await loadProperties(showLoading: false);
  }

  //==========================================================
  // Update
  //==========================================================

  Future<void> updateProperty(String id, Map<String, dynamic> data) async {
    await _repository.updateProperty(id, data);
    await loadProperties(showLoading: false);
  }

  //==========================================================
  // Delete
  //==========================================================

  Future<void> deleteProperty(String id) async {
    await _repository.deleteProperty(id);
    await loadProperties(showLoading: false);
  }

  //==========================================================
  // Favorites
  //==========================================================

  Future<List<PropertyEntity>> getFavoriteProperties() {
    return _repository.getFavoriteProperties();
  }

  Future<void> addToFavorites(String propertyId) async {
    await _repository.addToFavorites(propertyId);
    state.whenData((_) {});
  }

  Future<void> removeFromFavorites(String propertyId) async {
    await _repository.removeFromFavorites(propertyId);
    state.whenData((_) {});
  }

  Future<bool> isFavorite(String propertyId) {
    return _repository.isFavorite(propertyId);
  }
}

final propertyProvider =
    StateNotifierProvider<PropertyNotifier, AsyncValue<List<PropertyEntity>>>(
      (ref) => PropertyNotifier(
        ref.read(propertyRepositoryProvider),
        ref.read(propertyCacheProvider),
      ),
    );
