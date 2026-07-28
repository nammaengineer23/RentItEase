class LocationModel {
  final String address;
  final String locality;
  final String city;
  final String state;
  final String country;
  final String postalCode;

  final double latitude;
  final double longitude;

  const LocationModel({
    required this.address,
    required this.locality,
    required this.city,
    required this.state,
    required this.country,
    required this.postalCode,
    required this.latitude,
    required this.longitude,
  });

  factory LocationModel.fromJson(
    Map<String, dynamic> json,
  ) {
    return LocationModel(
      address: json['address'] ?? '',
      locality: json['locality'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      country: json['country'] ?? '',
      postalCode: json['postalCode'] ?? '',
      latitude:
          (json['latitude'] ?? 0).toDouble(),
      longitude:
          (json['longitude'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'locality': locality,
      'city': city,
      'state': state,
      'country': country,
      'postalCode': postalCode,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  LocationModel copyWith({
    String? address,
    String? locality,
    String? city,
    String? state,
    String? country,
    String? postalCode,
    double? latitude,
    double? longitude,
  }) {
    return LocationModel(
      address: address ?? this.address,
      locality: locality ?? this.locality,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      postalCode:
          postalCode ?? this.postalCode,
      latitude: latitude ?? this.latitude,
      longitude:
          longitude ?? this.longitude,
    );
  }

  String get fullAddress {
    return [
      address,
      locality,
      city,
      state,
      postalCode,
      country,
    ]
        .where((e) => e.isNotEmpty)
        .join(', ');
  }
}