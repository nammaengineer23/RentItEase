import '../../domain/entities/owner_property_entity.dart';

class OwnerPropertyModel extends OwnerPropertyEntity {
  const OwnerPropertyModel({
    required super.id,
    required super.title,
    required super.description,
    required super.address,
    required super.city,
    required super.stateName,
    required super.country,
    required super.pincode,
    required super.locality,
    required super.landmark,
    required super.latitude,
    required super.longitude,
    required super.rent,
    required super.securityDeposit,
    required super.bedrooms,
    required super.bathrooms,
    required super.area,
    required super.propertyType,
    required super.furnishing,
    required super.parking,
    required super.petFriendly,
    required super.imageUrl,
    required super.isAvailable,
    required super.isVerified,
    required super.totalViews,
    required super.pendingVisits,
    required super.createdAt,
    required super.views,
    required super.favorites,
    required super.visitRequests,
  });

  factory OwnerPropertyModel.fromJson(Map<String, dynamic> json) {
    final views = _toInt(json['views'] ?? json['totalViews']);

    return OwnerPropertyModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      stateName: json['state']?.toString() ?? '',
      country: json['country']?.toString() ?? '',
      pincode: json['pincode']?.toString() ?? '',
      locality: json['locality']?.toString() ?? '',
      landmark: json['landmark']?.toString() ?? '',
      latitude: _toNullableDouble(json['latitude']),
      longitude: _toNullableDouble(json['longitude']),
      rent: _toDouble(json['rent'] ?? json['price']),
      securityDeposit: _toDouble(json['securityDeposit']),
      bedrooms: _toInt(json['bedrooms']),
      bathrooms: _toInt(json['bathrooms']),
      area: _toDouble(json['area']),
      propertyType: json['propertyType']?.toString() ?? '',
      furnishing: json['furnishing']?.toString() ?? '',
      parking: json['parking'] as bool? ?? false,
      petFriendly: json['petFriendly'] as bool? ?? false,
      imageUrl: json['imageUrl']?.toString() ?? '',
      isAvailable: json['isAvailable'] as bool? ?? true,
      isVerified: json['isVerified'] as bool? ?? false,
      totalViews: _toInt(json['totalViews']),
      pendingVisits: _toInt(json['pendingVisits']),
      createdAt: _parseDate(json['createdAt']),
      views: views,
      favorites: _toInt(json['favorites']),
      visitRequests: _toInt(json['visitRequests']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'address': address,
      'city': city,
      'state': stateName,
      'country': country,
      'pincode': pincode,
      'locality': locality,
      'landmark': landmark,
      'latitude': latitude,
      'longitude': longitude,
      'price': rent,
      'securityDeposit': securityDeposit,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'area': area,
      'propertyType': propertyType,
      'furnishing': furnishing,
      'parking': parking,
      'petFriendly': petFriendly,
      'imageUrl': imageUrl,
      'isAvailable': isAvailable,
      'isVerified': isVerified,
      'totalViews': totalViews,
      'pendingVisits': pendingVisits,
      'createdAt': createdAt.toIso8601String(),
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

  static double? _toNullableDouble(dynamic value) {
    if (value == null) {
      return null;
    }

    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value.toString());
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
