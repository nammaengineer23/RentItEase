import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/property_repository_impl.dart';
import '../domain/entities/property_entity.dart';

final propertyRepositoryProvider = Provider<PropertyRepositoryImpl>(
  (ref) => PropertyRepositoryImpl(),
);

class PropertyNotifier extends StateNotifier<AsyncValue<List<PropertyEntity>>> {
  PropertyNotifier(this._repository) : super(const AsyncLoading()) {
    loadProperties();
  }

  final PropertyRepositoryImpl _repository;

  //==========================================================
  // Load All Properties
  //==========================================================

  Future<void> loadProperties() async {
    try {
      state = const AsyncLoading();

      final properties = await _repository.getProperties();

      state = AsyncData(properties);
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }

  //==========================================================
  // Refresh
  //==========================================================

  Future<void> refresh() async {
    await loadProperties();
  }

  //==========================================================
  // Property Details
  //==========================================================

  Future<PropertyEntity> getProperty(String id) {
    return _repository.getProperty(id);
  }

  //==========================================================
  // Featured
  //==========================================================

  List<PropertyEntity> featuredProperties() {
    return state.maybeWhen(
      data: (properties) =>
          properties.where((e) => e.isFeatured).toList(),
      orElse: () => [],
    );
  }

  //==========================================================
  // Available
  //==========================================================

  List<PropertyEntity> availableProperties() {
    return state.maybeWhen(
      data: (properties) =>
          properties.where((e) => e.isAvailable).toList(),
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

  Future<void> addProperty(
    Map<String, dynamic> data,
  ) async {
    await _repository.createProperty(data);

    await loadProperties();
  }

  //==========================================================
  // Update
  //==========================================================

  Future<void> updateProperty(
    String id,
    Map<String, dynamic> data,
  ) async {
    await _repository.updateProperty(id, data);

    await loadProperties();
  }

  //==========================================================
  // Delete
  //==========================================================

  Future<void> deleteProperty(String id) async {
    await _repository.deleteProperty(id);

    await loadProperties();
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

final propertyProvider = StateNotifierProvider<
    PropertyNotifier,
    AsyncValue<List<PropertyEntity>>>(
  (ref) => PropertyNotifier(
    ref.read(propertyRepositoryProvider),
  ),
);