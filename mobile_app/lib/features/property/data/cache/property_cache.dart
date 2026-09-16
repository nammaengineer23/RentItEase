import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/property_model.dart';
import '../../domain/entities/property_entity.dart';

/// Small persistent cache for the public property feed.
///
/// Cached data is shown immediately on the next launch while the API refreshes
/// in the background. The API remains the source of truth.
class PropertyCache {
  static const _propertiesKey = 'property_feed_cache_v1';
  static const _updatedAtKey = 'property_feed_cache_updated_at_v1';

  Future<List<PropertyEntity>> readProperties() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final raw = preferences.getString(_propertiesKey);
      if (raw == null || raw.isEmpty) return const <PropertyEntity>[];

      final decoded = jsonDecode(raw);
      if (decoded is! List) return const <PropertyEntity>[];

      return decoded
          .whereType<Map>()
          .map((item) => PropertyModel.fromJson(Map<String, dynamic>.from(item)).toEntity())
          .toList(growable: false);
    } catch (_) {
      return const <PropertyEntity>[];
    }
  }

  Future<void> writeProperties(List<PropertyEntity> properties) async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final payload = properties
          .map((property) => PropertyModel.fromEntity(property).toJson())
          .toList(growable: false);
      await preferences.setString(_propertiesKey, jsonEncode(payload));
      await preferences.setString(
        _updatedAtKey,
        DateTime.now().toUtc().toIso8601String(),
      );
    } catch (_) {
      // Cache failures must never prevent fresh API data from being displayed.
    }
  }

  Future<DateTime?> updatedAt() async {
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_updatedAtKey);
    return value == null ? null : DateTime.tryParse(value)?.toLocal();
  }

  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_propertiesKey);
    await preferences.remove(_updatedAtKey);
  }
}
