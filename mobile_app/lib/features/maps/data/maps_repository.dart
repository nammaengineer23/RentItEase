import '../models/location_model.dart';
import '../services/location_service.dart';

class MapsRepository {
  MapsRepository({LocationService? locationService})
    : _locationService = locationService ?? LocationService();

  final LocationService _locationService;

  /// Current GPS Location
  Future<LocationModel?> getCurrentLocation() {
    return _locationService.getCurrentLocation();
  }

  /// Reverse Geocoding
  Future<LocationModel> reverseGeocode({
    required double latitude,
    required double longitude,
  }) {
    return _locationService.reverseGeocode(latitude, longitude);
  }

  /// Search Address
  Future<LocationModel?> searchAddress(String address) {
    return _locationService.searchAddress(address);
  }

  /// Distance in KM
  double calculateDistance({
    required double startLat,
    required double startLng,
    required double endLat,
    required double endLng,
  }) {
    return _locationService.calculateDistance(
      startLat: startLat,
      startLng: startLng,
      endLat: endLat,
      endLng: endLng,
    );
  }

  /// Open Google Maps Navigation
  Future<void> openNavigation({
    required double latitude,
    required double longitude,
  }) {
    return _locationService.openNavigation(
      latitude: latitude,
      longitude: longitude,
    );
  }

  /// Open Location in Google Maps
  Future<void> openLocation({
    required double latitude,
    required double longitude,
  }) {
    return _locationService.openLocation(
      latitude: latitude,
      longitude: longitude,
    );
  }
}
