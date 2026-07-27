class PropertyModel {
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

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    return PropertyModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      rent: (json['rent'] ?? 0).toDouble(),
      city: json['city'] ?? '',
      locality: json['locality'] ?? '',
      address: json['address'] ?? '',
      bedrooms: json['bedrooms'] ?? 0,
      bathrooms: json['bathrooms'] ?? 0,
      balconies: json['balconies'] ?? 0,
      area: (json['area'] ?? 0).toDouble(),
      propertyType: json['propertyType'] ?? '',
      furnishing: json['furnishing'] ?? '',
      floor: json['floor'] ?? 0,
      totalFloors: json['totalFloors'] ?? 0,
      parking: json['parking'] ?? 0,
      isAvailable: json['isAvailable'] ?? true,
      isFeatured: json['isFeatured'] ?? false,
      isVerified: json['isVerified'] ?? false,
      rating: (json['rating'] ?? 0).toDouble(),
      views: json['views'] ?? 0,
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
      ownerId: json['ownerId'] ?? '',
      ownerName: json['ownerName'] ?? '',
      ownerPhone: json['ownerPhone'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ??
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
      views: views ?? this.views,
      imageUrls: imageUrls ?? this.imageUrls,
      ownerId: ownerId ?? this.ownerId,
      ownerName: ownerName ?? this.ownerName,
      ownerPhone: ownerPhone ?? this.ownerPhone,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}