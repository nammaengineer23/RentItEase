import '../../domain/entities/search_entity.dart';

class SearchModel extends SearchEntity {
  const SearchModel({
    super.query = '',
    super.city,
    super.locality,
    super.propertyType,
    super.bedrooms,
    super.minRent,
    super.maxRent,
    super.dailyRentEnabled = false,
    super.minDailyRent,
    super.maxDailyRent,
    super.verifiedOnly = false,
    super.availableOnly = true,
    super.parking = false,
    super.sortBy = 'newest',
    super.page = 1,
    super.limit = 10,
  });

  factory SearchModel.fromJson(Map<String, dynamic> json) {
    return SearchModel(
      query: json['query'] as String? ?? '',
      city: json['city'] as String?,
      locality: json['locality'] as String?,
      propertyType: json['propertyType'] as String?,
      bedrooms: json['bedrooms'] as int?,
      minRent: (json['minRent'] as num?)?.toDouble(),
      maxRent: (json['maxRent'] as num?)?.toDouble(),
      dailyRentEnabled: json['dailyRentEnabled'] as bool? ?? false,
      minDailyRent: (json['minDailyRent'] as num?)?.toDouble(),
      maxDailyRent: (json['maxDailyRent'] as num?)?.toDouble(),
      verifiedOnly: json['verifiedOnly'] as bool? ?? false,
      availableOnly: json['availableOnly'] as bool? ?? true,
      parking: json['parking'] as bool? ?? false,
      sortBy: json['sortBy'] as String? ?? 'newest',
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 10,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'query': query,
      'city': city,
      'locality': locality,
      'propertyType': propertyType,
      'bedrooms': bedrooms,
      'minRent': minRent,
      'maxRent': maxRent,
      'dailyRentEnabled': dailyRentEnabled,
      'minDailyRent': minDailyRent,
      'maxDailyRent': maxDailyRent,
      'verifiedOnly': verifiedOnly,
      'availableOnly': availableOnly,
      'parking': parking,
      'sortBy': sortBy,
      'page': page,
      'limit': limit,
    };
  }

  factory SearchModel.fromEntity(SearchEntity entity) {
    return SearchModel(
      query: entity.query,
      city: entity.city,
      locality: entity.locality,
      propertyType: entity.propertyType,
      bedrooms: entity.bedrooms,
      minRent: entity.minRent,
      maxRent: entity.maxRent,
      dailyRentEnabled: entity.dailyRentEnabled,
      minDailyRent: entity.minDailyRent,
      maxDailyRent: entity.maxDailyRent,
      verifiedOnly: entity.verifiedOnly,
      availableOnly: entity.availableOnly,
      parking: entity.parking,
      sortBy: entity.sortBy,
      page: entity.page,
      limit: entity.limit,
    );
  }
}
