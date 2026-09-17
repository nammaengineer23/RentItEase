import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart' as geo;
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/location_model.dart';

class LocationService {
  static const String _mapsApiKey = String.fromEnvironment('MAPS_API_KEY');

  Future<bool> requestPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission != LocationPermission.denied &&
        permission != LocationPermission.deniedForever;
  }

  Future<LocationModel?> getCurrentLocation() async {
    final allowed = await requestPermission();
    if (!allowed) return null;

    final Position position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

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

  Future<LocationModel> reverseGeocode(
    double latitude,
    double longitude,
  ) async {
    if (kIsWeb) return _reverseGeocodeWeb(latitude, longitude);

    final List<geo.Placemark> placemarks = await geo.placemarkFromCoordinates(
      latitude,
      longitude,
    );
    if (placemarks.isEmpty) {
      return LocationModel(latitude: latitude, longitude: longitude);
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
      locality: place.subLocality ?? '',
      city: place.locality ?? '',
      state: place.administrativeArea ?? '',
      country: place.country ?? '',
      postalCode: place.postalCode ?? '',
    );
  }

  Future<LocationModel> _reverseGeocodeWeb(
    double latitude,
    double longitude,
  ) async {
    if (_mapsApiKey.isEmpty) {
      throw StateError('MAPS_API_KEY is not configured for the web build.');
    }

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
      throw StateError('Google reverse geocoding failed: ${body['status']}');
    }

    final first = Map<String, dynamic>.from(results.first as Map);
    final components = (first['address_components'] as List? ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();

    String component(List<String> preferredTypes) {
      for (final type in preferredTypes) {
        for (final item in components) {
          final types = (item['types'] as List? ?? const []).map((e) => e.toString());
          if (types.contains(type)) return item['long_name']?.toString() ?? '';
        }
      }
      return '';
    }

    final locality = component([
      'sublocality_level_1',
      'sublocality',
      'neighborhood',
    ]);
    final city = component([
      'locality',
      'administrative_area_level_2',
      'postal_town',
    ]);

    return LocationModel(
      latitude: latitude,
      longitude: longitude,
      address: first['formatted_address']?.toString() ?? '',
      locality: locality,
      city: city,
      state: component(['administrative_area_level_1']),
      country: component(['country']),
      postalCode: component(['postal_code']),
    );
  }

  Future<LocationModel?> searchAddress(String address) async {
    if (kIsWeb) {
      if (_mapsApiKey.isEmpty) return null;
      final response = await Dio().get<Map<String, dynamic>>(
        'https://maps.googleapis.com/maps/api/geocode/json',
        queryParameters: {'address': address, 'key': _mapsApiKey},
      );
      final results = response.data?['results'];
      if (results is! List || results.isEmpty) return null;
      final location = ((results.first as Map)['geometry'] as Map)['location'] as Map;
      return reverseGeocode(
        (location['lat'] as num).toDouble(),
        (location['lng'] as num).toDouble(),
      );
    }

    final List<geo.Location> locations = await geo.locationFromAddress(address);
    if (locations.isEmpty) return null;
    final geo.Location location = locations.first;
    return reverseGeocode(location.latitude, location.longitude);
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
}
