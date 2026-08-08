import '../../domain/entities/owner_property_entity.dart';

class OwnerPropertyModel extends OwnerPropertyEntity {
  const OwnerPropertyModel({
    required super.id,
    required super.title,
    required super.city,
    required super.locality,
    required super.rent,
    required super.imageUrl,
    required super.isAvailable,
    required super.isVerified,
    required super.totalViews,
    required super.pendingVisits,
    required super.createdAt,
    required super.description,
    required super.address,
    required super.propertyType,
    required super.views,
    required super.favorites,
    required super.visitRequests,
  });

  factory OwnerPropertyModel.fromJson(Map<String, dynamic> json) {
    final views = _toInt(json['views'] ?? json['totalViews']);

    return OwnerPropertyModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      locality: json['locality']?.toString() ?? '',
      rent: _toDouble(json['rent']),
      imageUrl: json['imageUrl']?.toString() ?? '',
      isAvailable: json['isAvailable'] as bool? ?? true,
      isVerified: json['isVerified'] as bool? ?? false,
      totalViews: _toInt(json['totalViews']),
      pendingVisits: _toInt(json['pendingVisits']),
      createdAt: _parseDate(json['createdAt']),
      description: json['description']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      propertyType: json['propertyType']?.toString() ?? '',
      views: views,
      favorites: _toInt(json['favorites']),
      visitRequests: _toInt(json['visitRequests']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'city': city,
      'locality': locality,
      'rent': rent,
      'imageUrl': imageUrl,
      'isAvailable': isAvailable,
      'isVerified': isVerified,
      'totalViews': totalViews,
      'pendingVisits': pendingVisits,
      'createdAt': createdAt.toIso8601String(),
      'description': description,
      'address': address,
      'propertyType': propertyType,
      'views': views,
      'favorites': favorites,
      'visitRequests': visitRequests,
    };
  }

  static double _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }

  static int _toInt(dynamic value) {
    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static DateTime _parseDate(dynamic value) {
    if (value is DateTime) {
      return value;
    }

    return DateTime.tryParse(value?.toString() ?? '') ?? DateTime.now();
  }
}
