import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../property/data/repositories/property_repository_impl.dart';
import '../../property/domain/entities/property_entity.dart';
import '../../property/providers/property_provider.dart';
import '../models/location_model.dart';
import '../services/location_service.dart';

final mapsProvider = ChangeNotifierProvider<MapsProvider>(
  (ref) => MapsProvider(ref.read(propertyRepositoryProvider)),
);

class MapsProvider extends ChangeNotifier {
  MapsProvider(this._propertyRepository);

  final PropertyRepositoryImpl _propertyRepository;
  final LocationService _locationService = LocationService();

  //====================================================
  // Default Location (Bengaluru)
  //====================================================

  static const double defaultLatitude = 12.9716;
  static const double defaultLongitude = 77.5946;

  double latitude = defaultLatitude;
  double longitude = defaultLongitude;
  double zoom = 15;

  bool isLoading = false;

  String searchText = '';

  //====================================================
  // Selected Location
  //====================================================

  LocationModel? selectedLocation;

  //====================================================
  // Nearby Properties
  //====================================================

  List<PropertyEntity> nearbyProperties = [];

  PropertyEntity? selectedProperty;

  //====================================================
  // Search
  //====================================================

  void updateSearch(String value) {
    searchText = value;
    notifyListeners();
  }

  //====================================================
  // Select Location
  //====================================================

  void selectLocation(LocationModel location) {
    selectedLocation = location;
    latitude = location.latitude;
    longitude = location.longitude;

    notifyListeners();
  }

  //====================================================
  // Select Property
  //====================================================

  void selectProperty(PropertyEntity property) {
    selectedProperty = property;

    latitude = property.latitude;
    longitude = property.longitude;

    notifyListeners();
  }

  //====================================================
  // Camera
  //====================================================

  void moveCamera({required double lat, required double lng}) {
    latitude = lat;
    longitude = lng;

    notifyListeners();
  }

  //====================================================
  // Zoom
  //====================================================

  void zoomIn() {
    zoom++;
    notifyListeners();
  }

  void zoomOut() {
    if (zoom > 1) {
      zoom--;
      notifyListeners();
    }
  }

  //====================================================
  // Current Location
  //====================================================

  Future<void> fetchCurrentLocation() async {
    isLoading = true;
    notifyListeners();

    try {
      final location = await _locationService.getCurrentLocation();

      if (location != null) {
        latitude = location.latitude;
        longitude = location.longitude;
        selectedLocation = location;

        await loadNearbyProperties();
      }
    } catch (e) {
      debugPrint('Current Location Error: $e');
    }

    isLoading = false;
    notifyListeners();
  }

  //====================================================
  // Load Nearby Properties
  //====================================================

  Future<void> loadNearbyProperties({double radius = 5}) async {
    try {
      final properties = await _propertyRepository.getNearbyProperties(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );

      nearbyProperties = List<PropertyEntity>.from(properties);

      notifyListeners();
    } catch (e) {
      debugPrint('Nearby Properties Error: $e');
      nearbyProperties = [];
      notifyListeners();
    }
  }

  //====================================================
  // Search Address
  //====================================================

  Future<void> searchLocation(String address) async {
    if (address.trim().isEmpty) return;

    isLoading = true;
    notifyListeners();

    try {
      final result = await _locationService.searchAddress(address);

      if (result != null) {
        latitude = result.latitude;
        longitude = result.longitude;
        selectedLocation = result;

        await loadNearbyProperties();
      }
    } catch (e) {
      debugPrint('Search Error: $e');
    }

    isLoading = false;
    notifyListeners();
  }

  //====================================================
  // User Tapped Map
  //====================================================

  Future<void> updateLocationFromMap(double lat, double lng) async {
    latitude = lat;
    longitude = lng;

    selectedProperty = null;

    notifyListeners();

    try {
      selectedLocation = await _locationService.reverseGeocode(lat, lng);

      await loadNearbyProperties();
    } catch (e) {
      debugPrint('Reverse Geocode Error: $e');
    }

    notifyListeners();
  }

  //====================================================
  // Distance From Current Map Location
  //====================================================

  double distanceFrom({
    required double userLatitude,
    required double userLongitude,
  }) {
    if (selectedProperty == null) {
      return 0;
    }

    return _locationService.calculateDistance(
      startLat: userLatitude,
      startLng: userLongitude,
      endLat: selectedProperty!.latitude,
      endLng: selectedProperty!.longitude,
    );
  }

  //====================================================
  // Distance To Property
  //====================================================

  double distanceToProperty(PropertyEntity property) {
    return _locationService.calculateDistance(
      startLat: latitude,
      startLng: longitude,
      endLat: property.latitude,
      endLng: property.longitude,
    );
  }

  //====================================================
  // Navigate To Selected Property
  //====================================================

  Future<void> openPropertyNavigation(PropertyEntity property) async {
    selectedProperty = property;

    await _locationService.openNavigation(
      latitude: property.latitude,
      longitude: property.longitude,
    );
  }

  //====================================================
  // Navigate To Selected Location
  //====================================================

  Future<void> openNavigation() async {
    if (selectedProperty != null) {
      await openPropertyNavigation(selectedProperty!);
      return;
    }

    if (selectedLocation == null) return;

    await _locationService.openNavigation(
      latitude: selectedLocation!.latitude,
      longitude: selectedLocation!.longitude,
    );
  }

  //====================================================
  // Open In Google Maps
  //====================================================

  Future<void> openInGoogleMaps() async {
    if (selectedProperty != null) {
      await _locationService.openLocation(
        latitude: selectedProperty!.latitude,
        longitude: selectedProperty!.longitude,
      );
      return;
    }

    if (selectedLocation == null) return;

    await _locationService.openLocation(
      latitude: selectedLocation!.latitude,
      longitude: selectedLocation!.longitude,
    );
  }

  //====================================================
  // Clear Selected Property
  //====================================================

  void clearSelectedProperty() {
    selectedProperty = null;
    notifyListeners();
  }

  //====================================================
  // Reset Selected Location
  //====================================================

  void clearSelectedLocation() {
    selectedLocation = null;
    selectedProperty = null;

    latitude = defaultLatitude;
    longitude = defaultLongitude;
    zoom = 15;

    nearbyProperties = [];

    notifyListeners();
  }
}
