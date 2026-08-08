class OwnerPropertyEntity {
  const OwnerPropertyEntity({
    required this.id,
    required this.title,
    required this.city,
    required this.locality,
    required this.rent,
    required this.imageUrl,
    required this.isAvailable,
    required this.isVerified,
    required this.totalViews,
    required this.pendingVisits,
    required this.createdAt,
    required this.description,
    required this.address,
    required this.propertyType,
    required this.views,
    required this.favorites,
    required this.visitRequests,
  });

  final String id;
  final String title;
  final String city;
  final String locality;
  final double rent;
  final String imageUrl;

  final bool isAvailable;
  final bool isVerified;

  final int totalViews;
  final int pendingVisits;

  final DateTime createdAt;

  final String description;
  final String address;
  final String propertyType;

  final int views;
  final int favorites;
  final int visitRequests;
}
