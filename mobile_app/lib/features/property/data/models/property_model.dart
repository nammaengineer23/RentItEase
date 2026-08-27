import '../../domain/entities/property_entity.dart';

class PropertyModel {
  const PropertyModel({
    required this.id,
    required this.title,
    required this.description,
    required this.rent,
    required this.city,
    required this.locality,
    required this.address,
    required this.bedrooms,
    required this.bathrooms,
    required this.balconies,
    required this.area,
    required this.propertyType,
    required this.furnishing,
    required this.floor,
    required this.totalFloors,
    required this.parking,
    required this.isAvailable,
    required this.isFeatured,
    required this.isVerified,
    required this.rating,
    this.totalReviews = 0,
    required this.views,
    required this.imageUrls,
    required this.ownerId,
    required this.ownerName,
    required this.ownerPhone,
    required this.createdAt,
    required this.latitude,
    required this.longitude,
  });

  final String id;
  final String title;
  final String description;
  final double rent;
  final String city;
  final String locality;
  final String address;
  final int bedrooms;
  final int bathrooms;
  final int balconies;
  final double area;
  final String propertyType;
  final String furnishing;
  final int floor;
  final int totalFloors;
  final int parking;
  final bool isAvailable;
  final bool isFeatured;
  final bool isVerified;
  final double rating;
  final int totalReviews;
  final int views;
  final List<String> imageUrls;
  final String ownerId;
  final String ownerName;
  final String ownerPhone;
  final DateTime createdAt;

  final double latitude;
  final double longitude;

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    return PropertyModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      rent: (json['rent'] as num?)?.toDouble() ?? 0.0,
      city: json['city']?.toString() ?? '',
      locality: json['locality']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      bedrooms: (json['bedrooms'] as num?)?.toInt() ?? 0,
      bathrooms: (json['bathrooms'] as num?)?.toInt() ?? 0,
      balconies: (json['balconies'] as num?)?.toInt() ?? 0,
      area: (json['area'] as num?)?.toDouble() ?? 0.0,
      propertyType: json['propertyType']?.toString() ?? '',
      furnishing: json['furnishing']?.toString() ?? '',
      floor: (json['floor'] as num?)?.toInt() ?? 0,
      totalFloors: (json['totalFloors'] as num?)?.toInt() ?? 0,
      parking: (json['parking'] as num?)?.toInt() ?? 0,
      isAvailable: json['isAvailable'] == true,
      isFeatured: json['isFeatured'] == true,
      isVerified: json['isVerified'] == true,
      rating: (json['averageRating'] as num?)?.toDouble() ??
          (json['rating'] as num?)?.toDouble() ??
          0.0,
      totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
      views: (json['views'] as num?)?.toInt() ?? 0,
      imageUrls:
          (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      ownerId: json['ownerId']?.toString() ?? '',
      ownerName: json['ownerName']?.toString() ?? '',
      ownerPhone: json['ownerPhone']?.toString() ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),

      // Backend Decimal(9,6) values arrive as JSON numbers.
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'rent': rent,
      'city': city,
      'locality': locality,
      'address': address,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'balconies': balconies,
      'area': area,
      'propertyType': propertyType,
      'furnishing': furnishing,
      'floor': floor,
      'totalFloors': totalFloors,
      'parking': parking,
      'isAvailable': isAvailable,
      'isFeatured': isFeatured,
      'isVerified': isVerified,
      'rating': rating,
      'averageRating': rating,
      'totalReviews': totalReviews,
      'views': views,
      'imageUrls': imageUrls,
      'ownerId': ownerId,
      'ownerName': ownerName,
      'ownerPhone': ownerPhone,
      'createdAt': createdAt.toIso8601String(),

      'latitude': double.parse(latitude.toStringAsFixed(6)),
      'longitude': double.parse(longitude.toStringAsFixed(6)),
    };
  }

  PropertyModel copyWith({
    String? id,
    String? title,
    String? description,
    double? rent,
    String? city,
    String? locality,
    String? address,
    int? bedrooms,
    int? bathrooms,
    int? balconies,
    double? area,
    String? propertyType,
    String? furnishing,
    int? floor,
    int? totalFloors,
    int? parking,
    bool? isAvailable,
    bool? isFeatured,
    bool? isVerified,
    double? rating,
    int? totalReviews,
    int? views,
    List<String>? imageUrls,
    String? ownerId,
    String? ownerName,
    String? ownerPhone,
    DateTime? createdAt,
    double? latitude,
    double? longitude,
  }) {
    return PropertyModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      rent: rent ?? this.rent,
      city: city ?? this.city,
      locality: locality ?? this.locality,
      address: address ?? this.address,
      bedrooms: bedrooms ?? this.bedrooms,
      bathrooms: bathrooms ?? this.bathrooms,
      balconies: balconies ?? this.balconies,
      area: area ?? this.area,
      propertyType: propertyType ?? this.propertyType,
      furnishing: furnishing ?? this.furnishing,
      floor: floor ?? this.floor,
      totalFloors: totalFloors ?? this.totalFloors,
      parking: parking ?? this.parking,
      isAvailable: isAvailable ?? this.isAvailable,
      isFeatured: isFeatured ?? this.isFeatured,
      isVerified: isVerified ?? this.isVerified,
      rating: rating ?? this.rating,
      totalReviews: totalReviews ?? this.totalReviews,
      views: views ?? this.views,
      imageUrls: imageUrls ?? this.imageUrls,
      ownerId: ownerId ?? this.ownerId,
      ownerName: ownerName ?? this.ownerName,
      ownerPhone: ownerPhone ?? this.ownerPhone,
      createdAt: createdAt ?? this.createdAt,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }

  PropertyEntity toEntity() {
    return PropertyEntity(
      id: id,
      title: title,
      description: description,
      rent: rent,
      city: city,
      locality: locality,
      address: address,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      balconies: balconies,
      area: area,
      propertyType: propertyType,
      furnishing: furnishing,
      floor: floor,
      totalFloors: totalFloors,
      parking: parking,
      isAvailable: isAvailable,
      isFeatured: isFeatured,
      isVerified: isVerified,
      rating: rating,
      totalReviews: totalReviews,
      views: views,
      imageUrls: imageUrls,
      ownerId: ownerId,
      ownerName: ownerName,
      ownerPhone: ownerPhone,
      createdAt: createdAt,
      latitude: latitude,
      longitude: longitude,
    );
  }

  factory PropertyModel.fromEntity(PropertyEntity entity) {
    return PropertyModel(
      id: entity.id,
      title: entity.title,
      description: entity.description,
      rent: entity.rent,
      city: entity.city,
      locality: entity.locality,
      address: entity.address,
      bedrooms: entity.bedrooms,
      bathrooms: entity.bathrooms,
      balconies: entity.balconies,
      area: entity.area,
      propertyType: entity.propertyType,
      furnishing: entity.furnishing,
      floor: entity.floor,
      totalFloors: entity.totalFloors,
      parking: entity.parking,
      isAvailable: entity.isAvailable,
      isFeatured: entity.isFeatured,
      isVerified: entity.isVerified,
      rating: entity.rating,
      totalReviews: entity.totalReviews,
      views: entity.views,
      imageUrls: entity.imageUrls,
      ownerId: entity.ownerId,
      ownerName: entity.ownerName,
      ownerPhone: entity.ownerPhone,
      createdAt: entity.createdAt,
      latitude: entity.latitude,
      longitude: entity.longitude,
    );
  }
}
