import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/location_model.dart';
import '../services/location_service.dart';

final mapsProvider = ChangeNotifierProvider<MapsProvider>(
  (ref) => MapsProvider(),
);

class MapsProvider extends ChangeNotifier {
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
  // Nearby Properties (Dummy)
  // Replace with API later
  //====================================================

  final List<LocationModel> nearbyProperties = [
    const LocationModel(
      latitude: 12.9698,
      longitude: 77.7500,
      address: 'Prestige Lakeside Habitat',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560066',
    ),
    const LocationModel(
      latitude: 12.9752,
      longitude: 77.6065,
      address: 'Brigade Road Apartment',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
    ),
    const LocationModel(
      latitude: 12.9784,
      longitude: 77.6408,
      address: 'Indiranagar Residency',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560038',
    ),
  ];

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
      }
    } catch (e) {
      debugPrint('Current Location Error: $e');
    }

    isLoading = false;
    notifyListeners();
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
      }
    } catch (e) {
      debugPrint('Search Error: $e');
    }

    isLoading = false;
    notifyListeners();
  }

  //====================================================
  // User tapped on map
  //====================================================

  Future<void> updateLocationFromMap(double lat, double lng) async {
    latitude = lat;
    longitude = lng;
    notifyListeners();

    try {
      selectedLocation = await _locationService.reverseGeocode(lat, lng);
    } catch (e) {
      debugPrint('Reverse Geocode Error: $e');
    }

    notifyListeners();
  }

  //====================================================
  // Distance
  //====================================================

  double distanceFrom({
    required double userLatitude,
    required double userLongitude,
  }) {
    if (selectedLocation == null) {
      return 0;
    }

    return _locationService.calculateDistance(
      startLat: userLatitude,
      startLng: userLongitude,
      endLat: selectedLocation!.latitude,
      endLng: selectedLocation!.longitude,
    );
  }

  //====================================================
  // Google Maps Navigation
  //====================================================

  Future<void> openNavigation() async {
    if (selectedLocation == null) return;

    await _locationService.openNavigation(
      latitude: selectedLocation!.latitude,
      longitude: selectedLocation!.longitude,
    );
  }

  //====================================================
  // Open Google Maps
  //====================================================

  Future<void> openInGoogleMaps() async {
    if (selectedLocation == null) return;

    await _locationService.openLocation(
      latitude: selectedLocation!.latitude,
      longitude: selectedLocation!.longitude,
    );
  }

  //====================================================
  // Reset Selected Location
  //====================================================

  void clearSelectedLocation() {
    selectedLocation = null;
    latitude = defaultLatitude;
    longitude = defaultLongitude;
    zoom = 15;
    notifyListeners();
  }
}
