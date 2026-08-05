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
    required this.views,
    required this.imageUrls,
    required this.ownerId,
    required this.ownerName,
    required this.ownerPhone,
    required this.createdAt,
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
  final int views;
  final List<String> imageUrls;
  final String ownerId;
  final String ownerName;
  final String ownerPhone;
  final DateTime createdAt;

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
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      views: (json['views'] as num?)?.toInt() ?? 0,
      imageUrls: (json['imageUrls'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      ownerId: json['ownerId']?.toString() ?? '',
      ownerName: json['ownerName']?.toString() ?? '',
      ownerPhone: json['ownerPhone']?.toString() ?? '',
      createdAt: DateTime.tryParse(
            json['createdAt']?.toString() ?? '',
          ) ??
          DateTime.now(),
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
      'views': views,
      'imageUrls': imageUrls,
      'ownerId': ownerId,
      'ownerName': ownerName,
      'ownerPhone': ownerPhone,
      'createdAt': createdAt.toIso8601String(),
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
    int? views,
    List<String>? imageUrls,
    String? ownerId,
    String? ownerName,
    String? ownerPhone,
    DateTime? createdAt,
  }) {
    return PropertyModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      rent: rent ?? this.rent,
      city: city ?? this.city,
      locality: locality ?? this.local