import 'package:geocoding/geocoding.dart' as geo;
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/location_model.dart';

class LocationService {
  //==================================================
  // Request Permission
  //==================================================

  Future<bool> requestPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();

    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  //==================================================
  // Current Location
  //==================================================

  Future<LocationModel?> getCurrentLocation() async {
    final allowed = await requestPermission();

    if (!allowed) {
      return null;
    }

    final Position position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

    return reverseGeocode(position.latitude, position.longitude);
  }

  //==================================================
  // Reverse Geocode
  //==================================================

  Future<LocationModel> reverseGeocode(
    double latitude,
    double longitude,
  ) async {
    final List<geo.Placemark> placemarks = await geo.placemarkFromCoordinates(
      latitude,
      longitude,
    );

    if (placemarks.isEmpty) {
      return LocationModel(
        latitude: latitude,
        longitude: longitude,
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      );
    }

    final geo.Placemark place = placemarks.first;

    final addressParts = <String>[
      if ((place.street ?? '').isNotEmpty) place.street!,
      if ((place.subLocality ?? '').isNotEmpty) place.subLocality!,
      if ((place.locality ?? '').isNotEmpty) place.locality!,
    ];

    return LocationModel(
      latitude: latitude,
      longitude: longitude,
      address: addressParts.join(', '),
      city: place.locality ?? '',
      state: place.administrativeArea ?? '',
      country: place.country ?? '',
      postalCode: place.postalCode ?? '',
    );
  }

  //==================================================
  // Search Address
  //==================================================

  Future<LocationModel?> searchAddress(String address) async {
    final List<geo.Location> locations = await geo.locationFromAddress(address);

    if (locations.isEmpty) {
      return null;
    }

    final geo.Location location = locations.first;

    return reverseGeocode(location.latitude, location.longitude);
  }

  //==================================================
  // Distance
  //==================================================

  double calculateDistance({
    required double startLat,
    required double startLng,
    required double endLat,
    required double endLng,
  }) {
    final distance = Geolocator.distanceBetween(
      startLat,
      startLng,
      endLat,
      endLng,
    );

    return distance / 1000;
  }

  //==================================================
  // Google Navigation
  //==================================================

  Future<void> openNavigation({
    required double latitude,
    required double longitude,
  }) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude',
    );

    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch Google Navigation');
    }
  }

  //==================================================
  // Open Google Maps
  //==================================================

  Future<void> openLocation({
    required double latitude,
    required double longitude,
  }) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$latitude,$longitude',
    );

    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch Google Maps');
    }
  }
}
