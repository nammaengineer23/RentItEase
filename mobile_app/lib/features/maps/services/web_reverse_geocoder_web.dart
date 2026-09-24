@JS()
library;

import 'dart:async';
import 'dart:js_interop';

import '../models/location_model.dart';

@JS('google.maps.Geocoder')
extension type _GoogleGeocoder._(JSObject _) implements JSObject {
  external factory _GoogleGeocoder();
  external void geocode(JSAny request, JSFunction callback);
}

Future<LocationModel?> reverseGeocodeWithGoogleMapsJs(
  double latitude,
  double longitude,
) {
  final completer = Completer<LocationModel?>();
  final request = <String, dynamic>{
    'location': <String, double>{'lat': latitude, 'lng': longitude},
  }.jsify();

  _GoogleGeocoder().geocode(
    request,
    ((JSAny? results, JSString? status) {
      try {
        if (status?.toDart != 'OK') {
          completer.complete(null);
          return;
        }
        final dartResults = results?.dartify();
        if (dartResults is! List || dartResults.isEmpty) {
          completer.complete(null);
          return;
        }
        final first = Map<String, dynamic>.from(dartResults.first as Map);
        final components = (first['address_components'] as List? ?? const [])
            .whereType<Map>()
            .map(Map<String, dynamic>.from)
            .toList();

        String component(List<String> preferredTypes) {
          for (final type in preferredTypes) {
            for (final item in components) {
              final types = (item['types'] as List? ?? const [])
                  .map((value) => value.toString());
              if (types.contains(type)) {
                return item['long_name']?.toString() ?? '';
              }
            }
          }
          return '';
        }

        completer.complete(LocationModel(
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
        ));
      } catch (error) {
        completer.completeError(error);
      }
    }).toJS,
  );

  return completer.future.timeout(const Duration(seconds: 12));
}
