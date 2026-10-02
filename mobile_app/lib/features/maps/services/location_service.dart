import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart' as geo;
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/location_model.dart';
import 'location_exception.dart';
import 'location_privacy.dart';
import 'web_reverse_geocoder_stub.dart'
    if (dart.library.js_interop) 'web_reverse_geocoder_web.dart';

class LocationService {
  static const String _mapsApiKey = String.fromEnvironment('MAPS_API_KEY');

  Future<LocationPermission> permissionStatus() {
    return Geolocator.checkPermission();
  }

  Future<bool> requestPermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw const LocationException(
        LocationFailure.gpsDisabled,
        'Location services are turned off. Enable GPS and try again.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw const LocationException(
        LocationFailure.permissionDenied,
        'Location permission was denied. Allow location access to continue.',
      );
    }

    if (permission == LocationPermission.deniedForever) {
      throw const LocationException(
        LocationFailure.permissionPermanentlyDenied,
        'Location permission is permanently denied. Enable it in app settings.',
      );
    }

    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }

  Future<bool> openLocationSettings() => Geolocator.openLocationSettings();

  Future<bool> openAppSettings() => Geolocator.openAppSettings();

  Future<LocationModel> getCurrentLocation({
    Duration timeout = const Duration(seconds: 15),
    bool rejectMockLocation = true,
  }) async {
    await requestPermission();

    final Position position;
    try {
      position = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: timeout,
        ),
      );
    } on TimeoutException {
      throw const LocationException(
        LocationFailure.timeout,
        'Location lookup timed out. Check GPS signal and try again.',
      );
    } on LocationServiceDisabledException {
      throw const LocationException(
        LocationFailure.gpsDisabled,
        'Location services are turned off. Enable GPS and try again.',
      );
    } on PermissionDeniedException {
      throw const LocationException(
        LocationFailure.permissionDenied,
        'Location permission is not available.',
      );
    }

    if (rejectMockLocation && position.isMocked) {
      throw const LocationException(
        LocationFailure.mockLocation,
        'A simulated location was detected. Turn off mock location and try again.',
      );
    }

    try {
      return await reverseGeocode(position.latitude, position.longitude);
    } catch (error) {
      debugPrint('Reverse geocoding failed; using coordinates: $error');
      return LocationModel(
        latitude: position.latitude,
        longitude: position.longitude,
      );
    }
  }

  /// Returns a privacy-reduced coordinate suitable for ordinary user sharing.
  LocationModel sanitizeForSharing(LocationModel location) {
    return location.copyWith(
      latitude: LocationPrivacy.roundForSharing(location.latitude),
      longitude: LocationPrivacy.roundForSharing(location.longitude),
    );
  }

  Future<LocationModel> reverseGeocode(
    double latitude,
    double longitude,
  ) async {
    if (!_validCoordinate(latitude, longitude)) {
      throw const LocationException(
        LocationFailure.unavailable,
        'The selected coordinates are invalid.',
      );
    }

    if (kIsWeb) return _reverseGeocodeWeb(latitude, longitude);

    try {
      final placemarks = await geo.placemarkFromCoordinates(
        latitude,
        longitude,
      );
      if (placemarks.isEmpty) {
        return LocationModel(latitude: latitude, longitude: longitude);
      }

      final place = placemarks.first;
      final addressParts = <String>[
        if ((place.street ?? '').isNotEmpty) place.street!,
        if ((place.subLocality ?? '').isNotEmpty) place.subLocality!,
        if ((place.locality ?? '').isNotEmpty) place.locality!,
      ];

      return LocationModel(
        latitude: latitude,
        longitude: longitude,
        address: addressParts.join(', '),
        locality: place.subLocality ?? '',
        city: place.locality ?? '',
        state: place.administrativeArea ?? '',
        country: place.country ?? '',
        postalCode: place.postalCode ?? '',
      );
    } catch (_) {
      throw const LocationException(
        LocationFailure.unavailable,
        'We could not resolve this location to an address.',
      );
    }
  }

  Future<LocationModel> _reverseGeocodeWeb(
    double latitude,
    double longitude,
  ) async {
    try {
      final browserResult = await reverseGeocodeWithGoogleMapsJs(
        latitude,
        longitude,
      ).timeout(const Duration(seconds: 12));
      if (browserResult != null) return browserResult;
    } catch (error) {
      debugPrint('Maps JavaScript reverse geocoding failed: $error');
    }

    if (_mapsApiKey.isEmpty) {
      throw const LocationException(
        LocationFailure.unavailable,
        'Address lookup is unavailable on this web deployment.',
      );
    }

    try {
      final response = await Dio().get<Map<String, dynamic>>(
        'https://maps.googleapis.com/maps/api/geocode/json',
        queryParameters: {
          'latlng': '$latitude,$longitude',
          'key': _mapsApiKey,
        },
        options: Options(receiveTimeout: const Duration(seconds: 12)),
      );
      final body = response.data ?? const <String, dynamic>{};
      final results = body['results'];
      if (body['status'] != 'OK' || results is! List || results.isEmpty) {
        throw StateError('Google reverse geocoding failed.');
      }

      final first = Map<String, dynamic>.from(results.first as Map);
      return _locationFromGoogleResult(first, latitude, longitude);
    } catch (_) {
      throw const LocationException(
        LocationFailure.unavailable,
        'We could not resolve this location to an address.',
      );
    }
  }

  LocationModel _locationFromGoogleResult(
    Map<String, dynamic> first,
    double latitude,
    double longitude,
  ) {
    final components = (first['address_components'] as List? ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();

    String component(List<String> preferredTypes) {
      for (final type in preferredTypes) {
        for (final item in components) {
          final types = (item['types'] as List? ?? const []).map(
            (e) => e.toString(),
          );
          if (types.contains(type)) return item['long_name']?.toString() ?? '';
        }
      }
      return '';
    }

    return LocationModel(
      latitude: latitude,
      longitude: longitude,
      address: first['formatted_address']?.toString() ?? '',
      locality: component([
        'sublocality_level_1',
        'sublocality',
        'neighborhood',
      ]),
      city: component([
        'locality',
        'administrative_area_level_2',
        'postal_town',
      ]),
      state: component(['administrative_area_level_1']),
      country: component(['country']),
      postalCode: component(['postal_code']),
    );
  }

  Future<LocationModel?> searchAddress(String address) async {
    if (address.trim().isEmpty) return null;

    if (kIsWeb) {
      if (_mapsApiKey.isEmpty) return null;
      try {
        final response = await Dio().get<Map<String, dynamic>>(
          'https://maps.googleapis.com/maps/api/geocode/json',
          queryParameters: {'address': address, 'key': _mapsApiKey},
          options: Options(receiveTimeout: const Duration(seconds: 12)),
        );
        final results = response.data?['results'];
        if (results is! List || results.isEmpty) return null;
        final location =
            ((results.first as Map)['geometry'] as Map)['location'] as Map;
        return reverseGeocode(
          (location['lat'] as num).toDouble(),
          (location['lng'] as num).toDouble(),
        );
      } catch (_) {
        return null;
      }
    }

    try {
      final locations = await geo.locationFromAddress(address);
      if (locations.isEmpty) return null;
      final location = locations.first;
      return reverseGeocode(location.latitude, location.longitude);
    } catch (_) {
      return null;
    }
  }

  double calculateDistance({
    required double startLat,
    required double startLng,
    required double endLat,
    required double endLng,
  }) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng) / 1000;
  }

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

  bool _validCoordinate(double latitude, double longitude) =>
      latitude.isFinite &&
      longitude.isFinite &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;
}
