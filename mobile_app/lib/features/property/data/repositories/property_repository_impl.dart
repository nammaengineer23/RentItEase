import '../../domain/entities/property_entity.dart';
import '../../domain/repositories/property_repository.dart';

import '../datasources/property_remote_datasource.dart';
import '../models/property_model.dart';

class PropertyRepositoryImpl implements PropertyRepository {
  PropertyRepositoryImpl({
    PropertyRemoteDataSource? remoteDataSource,
  }) : _remoteDataSource =
            remoteDataSource ?? PropertyRemoteDataSource();

  final PropertyRemoteDataSource _remoteDataSource;

  final List<PropertyEntity> _favorites = [];

  //==========================================================
  // Get All Properties
  //==========================================================

  @override
  Future<List<PropertyEntity>> getProperties() async {
    final response = await _remoteDataSource.getProperties();

    return response
        .map(
          (json) => PropertyModel.fromJson(
            Map<String, dynamic>.from(json),
          ).toEntity(),
        )
        .toList();
  }

  //==========================================================
  // Property Details
  //==========================================================

  @override
  Future<PropertyEntity> getProperty(String id) async {
    final response = await _remoteDataSource.getProperty(id);

    return PropertyModel.fromJson(response).toEntity();
  }

  //==========================================================
  // My Properties
  //==========================================================

  @override
  Future<List<PropertyEntity>> getMyProperties() async {
    final response = await _remoteDataSource.getMyProperties();

    return response
        .map(
          (json) => PropertyModel.fromJson(
            Map<String, dynamic>.from(json),
          ).toEntity(),
        )
        .toList();
  }

  //==========================================================
  // Create Property
  //==========================================================

  @override
  Future<PropertyEntity> createProperty(
    Map<String, dynamic> data,
  ) async {
    final response = await _remoteDataSource.createProperty(data);

    return PropertyModel.fromJson(response).toEntity();
  }

  //==========================================================
  // Update Property
  //==========================================================

  @override
  Future<PropertyEntity> updateProperty(
    String id,
    Map<String, dynamic> data,
  ) async {
    final response = await _remoteDataSource.updateProperty(
      id: id,
      body: data,
    );

    return PropertyModel.fromJson(response).toEntity();
  }

  //==========================================================
  // Delete Property
  //==========================================================

  @override
  Future<void> deleteProperty(String id) async {
    await _remoteDataSource.deleteProperty(id);
  }

  //==========================================================
  // Nearby Properties
  //==========================================================

  @override
  Future<List<PropertyEntity>> getNearbyProperties({
    required double latitude,
    required double longitude,
    double radius = 5,
  }) async {
    final response = await _remoteDataSource.getNearbyProperties(
      latitude: latitude,
      longitude: longitude,
      radius: radius,
    );

    return response
        .map(
          (json) => PropertyModel.fromJson(
            Map<String, dynamic>.from(json),
          ).toEntity(),
        )
        .toList();
  }

  //==========================================================
  // Search
  //==========================================================

  @override
  Future<List<PropertyEntity>> searchProperties({
    String? keyword,
    String? city,
    String? locality,
    double? minRent,
    double? maxRent,
    int? bedrooms,
  }) async {
    final properties = await getProperties();

    return properties.where((property) {
      if (keyword != null &&
          keyword.isNotEmpty &&
          !(property.title.toLowerCase().contains(keyword.toLowerCase()) ||
              property.description.toLowerCase().contains(
                keyword.toLowerCase(),
              ))) {
        return false;
      }

      if (city != null &&
          city.isNotEmpty &&
          property.city.toLowerCase() != city.toLowerCase()) {
        return false;
      }

      if (locality != null &&
          locality.isNotEmpty &&
          !property.locality.toLowerCase().contains(
                locality.toLowerCase(),
              )) {
        return false;
      }

      if (minRent != null && property.rent < minRent) {
        return false;
      }

      if (maxRent != null && property.rent > maxRent) {
        return false;
      }

      if (bedrooms != null && property.bedrooms != bedrooms) {
        return false;
      }

      return true;
    }).toList();
  }

  //==========================================================
  // Favorites
  //==========================================================

  @override
  Future<List<PropertyEntity>> getFavoriteProperties() async {
    return List.unmodifiable(_favorites);
  }

  @override
  Future<void> addToFavorites(String propertyId) async {
    if (_favorites.any((e) => e.id == propertyId)) {
      return;
    }

    final property = await getProperty(propertyId);

    _favorites.add(property);
  }

  @override
  Future<void> removeFromFavorites(String propertyId) async {
    _favorites.removeWhere(
      (element) => element.id == propertyId,
    );
  }

  @override
  Future<bool> isFavorite(String propertyId) async {
    return _favorites.any(
      (element) => element.id == propertyId,
    );
  }
}