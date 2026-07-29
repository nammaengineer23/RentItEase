class PropertyEntity {
  const PropertyEntity({
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
}
