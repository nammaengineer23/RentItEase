class FavoritePropertyModel {
  const FavoritePropertyModel({
    required this.id,
    required this.propertyId,
    required this.title,
    required this.description,
    required this.propertyType,
    required this.bhk,
    required this.rent,
    required this.deposit,
    required this.location,
    required this.address,
    this.imageUrl,
  });

  final String id;
  final String propertyId;
  final String title;
  final String description;
  final String propertyType;
  final String bhk;
  final double rent;
  final double deposit;
  final String location;
  final String address;
  final String? imageUrl;

  factory FavoritePropertyModel.fromJson(Map<String, dynamic> json) {
    final property = json['property'] is Map
        ? Map<String, dynamic>.from(json['property'] as Map)
        : json;

    String? imageUrl;

    // Direct imageUrl support.
    final directImage = property['imageUrl'];

    if (directImage is String && directImage.isNotEmpty) {
      imageUrl = directImage;
    }

    // Backend currently returns primary images
    // through property.images.
    if (imageUrl == null) {
      final images = property['images'];

      if (images is List && images.isNotEmpty) {
        for (final item in images) {
          if (item is Map) {
            final image = Map<String, dynamic>.from(item);

            final url = image['url'] ?? image['imageUrl'] ?? image['secureUrl'];

            if (url is String && url.isNotEmpty) {
              imageUrl = url;
              break;
            }
          } else if (item is String && item.isNotEmpty) {
            imageUrl = item;
            break;
          }
        }
      }
    }

    return FavoritePropertyModel(
      id: json['id']?.toString() ?? '',
      propertyId: property['id']?.toString() ?? '',
      title: property['title']?.toString() ?? '',
      description: property['description']?.toString() ?? '',
      propertyType: property['propertyType']?.toString() ?? '',
      bhk: property['bhk']?.toString() ?? '',
      rent: _toDouble(property['rent']),
      deposit: _toDouble(property['deposit']),
      location: _buildLocation(property),
      address: property['address']?.toString() ?? '',
      imageUrl: imageUrl,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'propertyId': propertyId,
      'title': title,
      'description': description,
      'propertyType': propertyType,
      'bhk': bhk,
      'rent': rent,
      'deposit': deposit,
      'location': location,
      'address': address,
      'imageUrl': imageUrl,
    };
  }

  static double _toDouble(dynamic value) {
    if (value == null) {
      return 0;
    }

    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value.toString()) ?? 0;
  }

  static String _buildLocation(Map<String, dynamic> property) {
    final location = property['location'];

    if (location is String && location.isNotEmpty) {
      return location;
    }

    final locality = property['locality']?.toString() ?? '';
    final city = property['city']?.toString() ?? '';

    if (locality.isNotEmpty && city.isNotEmpty) {
      return '$locality, $city';
    }

    if (locality.isNotEmpty) {
      return locality;
    }

    return city;
  }
}
