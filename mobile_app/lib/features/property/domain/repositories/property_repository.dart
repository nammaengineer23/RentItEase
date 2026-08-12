import '../entities/property_entity.dart';

abstract class PropertyRepository {
  //==================================================
  // Get All Properties
  //==================================================

  Future<List<PropertyEntity>> getProperties();

  //==================================================
  // Get Property By ID
  //==================================================

  Future<PropertyEntity> getProperty(String id);

  //==================================================
  // Get Logged-in Owner Properties
  //==================================================

  Future<List<PropertyEntity>> getMyProperties();

  //==================================================
  // Create Property
  //==================================================

  Future<PropertyEntity> createProperty(Map<String, dynamic> data);

  //==================================================
  // Update Property
  //==================================================

  Future<PropertyEntity> updateProperty(String id, Map<String, dynamic> data);

  //==================================================
  // Delete Property
  //==================================================

  Future<void> deleteProperty(String id);

  //==================================================
  // Nearby Properties
  //==================================================

  Future<List<PropertyEntity>> getNearbyProperties({
    required double latitude,
    required double longitude,
    double radius = 5,
  });

  //==================================================
  // Search Properties
  //==================================================

  Future<List<PropertyEntity>> searchProperties({
    String? keyword,
    String? city,
    String? locality,
    double? minRent,
    double? maxRent,
    int? bedrooms,
  });

  //==================================================
  // Favorite Properties
  //==================================================

  Future<List<PropertyEntity>> getFavoriteProperties();

  Future<void> addToFavorites(String propertyId);

  Future<void> removeFromFavorites(String propertyId);

  Future<bool> isFavorite(String propertyId);
}
