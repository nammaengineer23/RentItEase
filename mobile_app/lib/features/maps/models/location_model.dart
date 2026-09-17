class LocationModel {
  const LocationModel({
    required this.latitude,
    required this.longitude,
    this.address = '',
    this.locality = '',
    this.city = '',
    this.state = '',
    this.country = '',
    this.postalCode = '',
  });

  final double latitude;
  final double longitude;

  final String address;
  final String locality;
  final String city;
  final String state;
  final String country;
  final String postalCode;

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    final latitude = _coordinate(json['latitude'], 'latitude');
    final longitude = _coordinate(json['longitude'], 'longitude');
    return LocationModel(
      latitude: latitude,
      longitude: longitude,
      address: json['address'] ?? '',
      locality: json['locality'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      country: json['country'] ?? '',
      postalCode: json['postalCode'] ?? '',
    );
  }

  static double _coordinate(dynamic value, String name) {
    final coordinate = value is num
        ? value.toDouble()
        : double.tryParse(value?.toString() ?? '');
    if (coordinate == null || !coordinate.isFinite) {
      throw FormatException('Location $name is missing or invalid.');
    }
    return coordinate;
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'locality': locality,
      'city': city,
      'state': state,
      'country': country,
      'postalCode': postalCode,
    };
  }

  LocationModel copyWith({
    double? latitude,
    double? longitude,
    String? address,
    String? locality,
    String? city,
    String? state,
    String? country,
    String? postalCode,
  }) {
    return LocationModel(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      locality: locality ?? this.locality,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      postalCode: postalCode ?? this.postalCode,
    );
  }

  @override
  String toString() {
    return '$address ($latitude, $longitude)';
  }
}
