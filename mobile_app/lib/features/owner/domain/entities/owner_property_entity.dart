class OwnerPropertyEntity {
  const OwnerPropertyEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.address,
    required this.city,
    required this.stateName,
    required this.country,
    required this.pincode,
    required this.locality,
    required this.landmark,
    required this.latitude,
    required this.longitude,
    required this.rent,
    required this.securityDeposit,
    required this.bedrooms,
    required this.bathrooms,
    required this.area,
    required this.propertyType,
    required this.furnishing,
    required this.parking,
    required this.petFriendly,
    required this.imageUrl,
    required this.isAvailable,
    required this.isVerified,
    required this.totalViews,
    required this.pendingVisits,
    required this.createdAt,
    required this.views,
    required this.favorites,
    required this.visitRequests,
  });

  final String id;

  final String title;
  final String description;

  final String address;
  final String city;
  final String stateName;
  final String country;
  final String pincode;
  final String locality;
  final String landmark;

  final double? latitude;
  final double? longitude;

  final double rent;
  final double securityDeposit;

  final int bedrooms;
  final int bathrooms;
  final double area;

  final String propertyType;
  final String furnishing;

  final bool parking;
  final bool petFriendly;

  final String imageUrl;

  final bool isAvailable;
  final bool isVerified;

  final int totalViews;
  final int pendingVisits;

  final DateTime createdAt;

  final int views;
  final int favorites;
  final int visitRequests;
}
