class SearchEntity {
  final String query;
  final String? city;
  final String? locality;
  final String? propertyType;
  final int? bedrooms;
  final double? minRent;
  final double? maxRent;
  final bool dailyRentEnabled;
  final double? minDailyRent;
  final double? maxDailyRent;
  final bool verifiedOnly;
  final bool availableOnly;
  final bool parking;
  final String sortBy;
  final int page;
  final int limit;

  const SearchEntity({
    this.query = '',
    this.city,
    this.locality,
    this.propertyType,
    this.bedrooms,
    this.minRent,
    this.maxRent,
    this.dailyRentEnabled = false,
    this.minDailyRent,
    this.maxDailyRent,
    this.verifiedOnly = false,
    this.availableOnly = true,
    this.parking = false,
    this.sortBy = 'newest',
    this.page = 1,
    this.limit = 10,
  });

  SearchEntity copyWith({
    String? query,
    String? city,
    String? locality,
    String? propertyType,
    int? bedrooms,
    double? minRent,
    double? maxRent,
    bool? dailyRentEnabled,
    double? minDailyRent,
    double? maxDailyRent,
    bool? verifiedOnly,
    bool? availableOnly,
    bool? parking,
    String? sortBy,
    int? page,
    int? limit,
  }) {
    return SearchEntity(
      query: query ?? this.query,
      city: city ?? this.city,
      locality: locality ?? this.locality,
      propertyType: propertyType ?? this.propertyType,
      bedrooms: bedrooms ?? this.bedrooms,
      minRent: minRent ?? this.minRent,
      maxRent: maxRent ?? this.maxRent,
      dailyRentEnabled: dailyRentEnabled ?? this.dailyRentEnabled,
      minDailyRent: minDailyRent ?? this.minDailyRent,
      maxDailyRent: maxDailyRent ?? this.maxDailyRent,
      verifiedOnly: verifiedOnly ?? this.verifiedOnly,
      availableOnly: availableOnly ?? this.availableOnly,
      parking: parking ?? this.parking,
      sortBy: sortBy ?? this.sortBy,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }
}
