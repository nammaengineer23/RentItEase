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

  // ============================================================
  // JSON → Model
  // ============================================================

  factory FavoritePropertyModel.fromJson(
    Map<String, dynamic> json,
  ) {
    /*
     * Backend response:
     *
     * {
     *   id: "...",
     *   userId: "...",
     *   propertyId: "...",
     *   property: {
     *     id: "...",
     *     title: "...",
     *     description: "...",
     *     price: ...,
     *     securityDeposit: ...,
     *     address: "...",
     *     city: "...",
     *     locality: "...",
     *     propertyType: "...",
     *     bedrooms: ...,
     *     images: [
     *       {
     *         imageUrl: "...",
     *         isPrimary: true
     *       }
     *     ]
     *   }
     * }
     */

    final property = _asMap(json['property']) ?? json;

    return FavoritePropertyModel(
      id: _toStringValue(json['id']),
      propertyId: _toStringValue(
        property['id'] ?? json['propertyId'],
      ),
      title: _toStringValue(property['title']),
      description: _toStringValue(property['description']),
      propertyType: _toStringValue(property['propertyType']),
      bhk: _buildBhk(property),
      rent: _toDouble(
        property['price'] ?? property['rent'],
      ),
      deposit: _toDouble(
        property['securityDeposit'] ?? property['deposit'],
      ),
      location: _buildLocation(property),
      address: _toStringValue(property['address']),
      imageUrl: _extractImageUrl(property),
    );
  }

  // ============================================================
  // Model → JSON
  // ============================================================

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

  // ============================================================
  // Helpers
  // ============================================================

  static Map<String, dynamic>? _asMap(dynamic value) {
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return null;
  }

  // ============================================================
  // String Conversion
  // ============================================================

  static String _toStringValue(dynamic value) {
    if (value == null) {
      return '';
    }

    return value.toString();
  }

  // ============================================================
  // Number Conversion
  // ============================================================

  static double _toDouble(dynamic value) {
    if (value == null) {
      return 0.0;
    }

    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value.toString()) ?? 0.0;
  }

  // ============================================================
  // BHK
  // ============================================================

  static String _buildBhk(
    Map<String, dynamic> property,
  ) {
    /*
     * Current Prisma Property model stores:
     *
     * bedrooms: Int
     *
     * Some older Flutter/backend responses may provide:
     *
     * bhk: "2 BHK"
     */

    final existingBhk = property['bhk'];

    if (existingBhk != null &&
        existingBhk.toString().trim().isNotEmpty) {
      return existingBhk.toString();
    }

    final bedrooms = property['bedrooms'];

    if (bedrooms is num) {
      return '${bedrooms.toInt()} BHK';
    }

    if (bedrooms != null &&
        bedrooms.toString().trim().isNotEmpty) {
      return '${bedrooms.toString()} BHK';
    }

    return '';
  }

  // ============================================================
  // Location
  // ============================================================

  static String _buildLocation(
    Map<String, dynamic> property,
  ) {
    /*
     * Prefer an explicit location field if one exists.
     *
     * Otherwise construct:
     *
     * locality, city
     *
     * or:
     *
     * city
     */

    final explicitLocation = property['location'];

    if (explicitLocation is String &&
        explicitLocation.trim().isNotEmpty) {
      return explicitLocation.trim();
    }

    final locality = _toStringValue(
      property['locality'],
    ).trim();

    final city = _toStringValue(
      property['city'],
    ).trim();

    if (locality.isNotEmpty && city.isNotEmpty) {
      return '$locality, $city';
    }

    if (locality.isNotEmpty) {
      return locality;
    }

    if (city.isNotEmpty) {
      return city;
    }

    return _toStringValue(
      property['address'],
    ).trim();
  }

  // ============================================================
  // Image URL
  // ============================================================

  static String? _extractImageUrl(
    Map<String, dynamic> property,
  ) {
    /*
     * Current Prisma model:
     *
     * PropertyImage.imageUrl
     *
     * We also support older/alternative API names so that
     * the Flutter app remains tolerant of existing responses.
     */

    final directImageUrl = property['imageUrl'];

    if (directImageUrl is String &&
        directImageUrl.trim().isNotEmpty) {
      return directImageUrl.trim();
    }

    final images = property['images'];

    if (images is! List || images.isEmpty) {
      return null;
    }

    // First preference: primary image.
    for (final item in images) {
      final image = _asMap(item);

      if (image == null) {
        continue;
      }

      final isPrimary = image['isPrimary'] == true;

      if (!isPrimary) {
        continue;
      }

      final url = _extractImageUrlFromItem(image);

      if (url != null) {
        return url;
      }
    }

    // Fallback: first valid image.
    for (final item in images) {
      if (item is String &&
          item.trim().isNotEmpty) {
        return item.trim();
      }

      final image = _asMap(item);

      if (image == null) {
        continue;
      }

      final url = _extractImageUrlFromItem(image);

      if (url != null) {
        return url;
      }
    }

    return null;
  }

  // ============================================================
  // Individual Image
  // ============================================================

  static String? _extractImageUrlFromItem(
    Map<String, dynamic> image,
  ) {
    final candidates = [
      image['imageUrl'],
      image['url'],
      image['secureUrl'],
      image['src'],
    ];

    for (final candidate in candidates) {
      if (candidate is String &&
          candidate.trim().isNotEmpty) {
        return candidate.trim();
      }
    }

    return null;
  }
}