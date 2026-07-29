import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/property_repository_impl.dart';
import '../domain/entities/property_entity.dart';

final propertyRepositoryProvider = Provider<PropertyRepositoryImpl>(
  (ref) => PropertyRepositoryImpl(),
);

class PropertyNotifier extends StateNotifier<AsyncValue<List<PropertyEntity>>> {
  PropertyNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadProperties();
  }

  final PropertyRepositoryImpl _repository;

  //=========================================
  // Load All Properties
  //=========================================

  Future<void> loadProperties() async {
    try {
      state = const AsyncLoading();

      final properties = await _repository.getProperties();

      state = AsyncData(properties);
    } catch (e, stack) {
      state = AsyncError(e, stack);
    }
  }

  //=========================================
  // Refresh
  //=========================================

  Future<void> refresh() async {
    await loadProperties();
  }

  //=========================================
  // Featured Properties
  //=========================================

  List<PropertyEntity> featuredProperties() {
    return state.maybeWhen(
      data: (properties) => properties.where((e) => e.isFeatured).toList(),
      orElse: () => [],
    );
  }

  //=========================================
  // Available Properties
  //=========================================

  List<PropertyEntity> availableProperties() {
    return state.maybeWhen(
      data: (properties) => properties.where((e) => e.isAvailable).toList(),
      orElse: () => [],
    );
  }

  //=========================================
  // Search
  //=========================================

  List<PropertyEntity> search(String query) {
    final q = query.toLowerCase();

    return state.maybeWhen(
      data: (properties) => properties.where((property) {
        return property.title.toLowerCase().contains(q) ||
            property.city.toLowerCase().contains(q) ||
            property.locality.toLowerCase().contains(q);
      }).toList(),
      orElse: () => [],
    );
  }

  //=========================================
  // Add Property
  //=========================================

  Future<void> addProperty(Map<String, dynamic> data) async {
    await _repository.createProperty(data);

    await loadProperties();
  }

  //=========================================
  // Delete Property
  //=========================================

  Future<void> deleteProperty(String id) async {
    await _repository.deleteProperty(id);

    await loadProperties();
  }

  //=========================================
  // Update Property
  //=========================================

  Future<void> updateProperty(String id, Map<String, dynamic> data) async {
    await _repository.updateProperty(id, data);

    await loadProperties();
  }
}

final propertyProvider =
    StateNotifierProvider<PropertyNotifier, AsyncValue<List<PropertyEntity>>>(
      (ref) => PropertyNotifier(ref.read(propertyRepositoryProvider)),
    );
