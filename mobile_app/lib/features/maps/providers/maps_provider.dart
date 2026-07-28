import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/location_model.dart';

final mapsProvider =
    ChangeNotifierProvider<MapsProvider>(
  (ref) => MapsProvider(),
);

class MapsProvider extends ChangeNotifier {
  // ==================================================
  // Default Location (Bengaluru)
  // ==================================================

  static const double defaultLatitude =
      12.9716;

  static const double defaultLongitude =
      77.5946;

  double latitude = defaultLatitude;

  double longitude = defaultLongitude;

  double zoom = 15;

  bool isLoading = false;

  String searchText = '';

  // ==================================================
  // Selected Location
  // ==================================================

  LocationModel? selectedLocation;

  // ==================================================
  // Dummy Nearby Properties
  // ==================================================

  final List<LocationModel> nearbyProperties = [
    const LocationModel(
      address: 'Prestige Lakeside Habitat',
      locality: 'Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560066',
      latitude: 12.9698,
      longitude: 77.7500,
    ),
    const LocationModel(
      address: 'Brigade Road Apartment',
      locality: 'Brigade Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      latitude: 12.9752,
      longitude: 77.6065,
    ),
    const LocationModel(
      address: 'Indiranagar Residency',
      locality: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560038',
      latitude: 12.9784,
      longitude: 77.6408,
    ),
  ];

  // ==================================================
  // Update Search
  // ==================================================

  void updateSearch(String value) {
    searchText = value;
    notifyListeners();
  }

  // ==================================================
  // Select Location
  // ==================================================

  void selectLocation(
    LocationModel location,
  ) {
    selectedLocation = location;
    latitude = location.latitude;
    longitude = location.longitude;

    notifyListeners();
  }

  // ==================================================
  // Move Camera
  // ==================================================

  void moveCamera({
    required double lat,
    required double lng,
  }) {
    latitude = lat;
    longitude = lng;

    notifyListeners();
  }

  // ==================================================
  // Zoom In
  // ==================================================

  void zoomIn() {
    zoom++;

    notifyListeners();
  }

  // ==================================================
  // Zoom Out
  // ==================================================

  void zoomOut() {
    if (zoom > 1) {
      zoom--;
      notifyListeners();
    }
  }

  // ==================================================
  // Current Location
  // (Dummy for now)
  // ==================================================

  Future<void> fetchCurrentLocation() async {
    isLoading = true;

    notifyListeners();

    await Future.delayed(
      const Duration(seconds: 1),
    );

    latitude = defaultLatitude;

    longitude = defaultLongitude;

    selectedLocation = const LocationModel(
      address: 'Current Location',
      locality: 'Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      latitude: defaultLatitude,
      longitude: defaultLongitude,
    );

    isLoading = false;

    notifyListeners();
  }
}