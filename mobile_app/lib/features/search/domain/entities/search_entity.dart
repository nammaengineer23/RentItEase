class SearchEntity {
  final String query;
  final String? city;
  final String? locality;
  final String? propertyType;
  final int? bedrooms;
  final double? minRent;
  final double? maxRent;
  final bool verifiedOnly;
  final bool availableOnly;
  final bool parking;
  final String sortBy;

  const SearchEntity({
    this.query = '',
    this.city,
    this.locality,
    this.propertyType,
    this.bedrooms,
    this.minRent,
    this.maxRent,
    this.verifiedOnly = false,
    this.availableOnly = true,
    this.parking = false,
    this.sortBy = 'newest',
  });

  SearchEntity copyWith({
    String? query,
    String? city,
    String? locality,
    String? propertyType,
    int? bedrooms,
    double? minRent,
    double? maxRent,
    bool? verifiedOnly,
    bool? availableOnly,
    bool? parking,
    String? sortBy,
  }) {
    return SearchEntity(
      query: query ?? this.query,
      city: city ?? this.city,
      locality: locality ?? this.locality,
      propertyType: propertyType ?? this.propertyType,
      bedrooms: bedrooms ?? this.bedrooms,
      minRent: minRent ?? this.minRent,
      maxRent: maxRent ?? this.maxRent,
      verifiedOnly: verifiedOnly ?? this.verifiedOnly,
      availableOnly: availableOnly ?? this.availableOnly,
      parking: parking ?? this.parking,
      sortBy: sortBy ?? this.sortBy,
    );
  }

  
}