import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../property/data/repositories/property_repository_impl.dart';
import '../../property/domain/entities/property_entity.dart';
import '../../property/providers/property_provider.dart';
import '../models/location_model.dart';
import '../services/location_exception.dart';
import '../services/location_service.dart';

final mapsProvider = ChangeNotifierProvider<MapsProvider>(
  (ref) => MapsProvider(ref.read(propertyRepositoryProvider)),
);

class MapsProvider extends ChangeNotifier {
  MapsProvider(this._propertyRepository);

  final PropertyRepositoryImpl _propertyRepository;
  final LocationService _locationService = LocationService();

  static const double defaultLatitude = 12.9716;
  static const double defaultLongitude = 77.5946;

  double latitude = defaultLatitude;
  double longitude = defaultLongitude;
  double zoom = 15;

  bool isLoading = false;
  String? errorMessage;
  String searchText = '';

  LocationModel? selectedLocation;
  List<PropertyEntity> nearbyProperties = [];
  PropertyEntity? selectedProperty;

  void updateSearch(String value) {
    searchText = value;
    notifyListeners();
  }

  void selectLocation(LocationModel location) {
    selectedLocation = location;
    latitude = location.latitude;
    longitude = location.longitude;
    errorMessage = null;
    notifyListeners();
  }

  void selectProperty(PropertyEntity property) {
    selectedProperty = property;
    latitude = property.latitude;
    longitude = property.longitude;
    notifyListeners();
  }

  void moveCamera({required double lat, required double lng}) {
    latitude = lat;
    longitude = lng;
    notifyListeners();
  }

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

  Future<void> fetchCurrentLocation() async {
    if (isLoading) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final location = await _locationService.getCurrentLocation();
      latitude = location.latitude;
      longitude = location.longitude;
      selectedLocation = location;
      await loadNearbyProperties();
    } on LocationException catch (error) {
      errorMessage = error.message;
    } catch (_) {
      errorMessage = 'We could not determine your location. Please try again.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> openLocationSettings() => _locationService.openLocationSettings();

  Future<bool> openAppSettings() => _locationService.openAppSettings();

  LocationModel? get privacySafeSelectedLocation {
    final location = selectedLocation;
    return location == null ? null : _locationService.sanitizeForSharing(location);
  }

  Future<void> loadNearbyProperties({double radius = 5}) async {
    try {
      final properties = await _propertyRepository.getNearbyProperties(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
      nearbyProperties = List<PropertyEntity>.from(properties);
    } catch (_) {
      nearbyProperties = [];
      errorMessage ??= 'Nearby properties could not be loaded.';
    }
    notifyListeners();
  }

  Future<void> searchLocation(String address) async {
    if (address.trim().isEmpty || isLoading) return;

    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final result = await _locationService.searchAddress(address);
      if (result == null) {
        errorMessage = 'No matching location was found.';
      } else {
        latitude = result.latitude;
        longitude = result.longitude;
        selectedLocation = result;
        await loadNearbyProperties();
      }
    } catch (_) {
      errorMessage = 'Location search is temporarily unavailable.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateLocationFromMap(double lat, double lng) async {
    latitude = lat;
    longitude = lng;
    selectedProperty = null;
    errorMessage = null;
    notifyListeners();

    try {
      selectedLocation = await _locationService.reverseGeocode(lat, lng);
      await loadNearbyProperties();
    } on LocationException catch (error) {
      errorMessage = error.message;
    } catch (_) {
      errorMessage = 'We could not resolve this map location.';
    }
    notifyListeners();
  }

  double distanceFrom({
    required double userLatitude,
    required double userLongitude,
  }) {
    if (selectedProperty == null) return 0;
    return _locationService.calculateDistance(
      startLat: userLatitude,
      startLng: userLongitude,
      endLat: selectedProperty!.latitude,
      endLng: selectedProperty!.longitude,
    );
  }

  double distanceToProperty(PropertyEntity property) {
    return _locationService.calculateDistance(
      startLat: latitude,
      startLng: longitude,
      endLat: property.latitude,
      endLng: property.longitude,
    );
  }

  Future<void> openPropertyNavigation(PropertyEntity property) async {
    selectedProperty = property;
    await _locationService.openNavigation(
      latitude: property.latitude,
      longitude: property.longitude,
    );
  }

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

  void clearSelectedProperty() {
    selectedProperty = null;
    notifyListeners();
  }

  void clearSelectedLocation() {
    selectedLocation = null;
    selectedProperty = null;
    latitude = defaultLatitude;
    longitude = defaultLongitude;
    zoom = 15;
    nearbyProperties = [];
    errorMessage = null;
    notifyListeners();
  }
}
