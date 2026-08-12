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
    super.verifiedOnly = false,
    super.availableOnly = true,
    super.parking = false,
    super.sortBy = 'newest',
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
      verifiedOnly: json['verifiedOnly'] as bool? ?? false,
      availableOnly: json['availableOnly'] as bool? ?? true,
      parking: json['parking'] as bool? ?? false,
      sortBy: json['sortBy'] as String? ?? 'newest',
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
      'verifiedOnly': verifiedOnly,
      'availableOnly': availableOnly,
      'parking': parking,
      'sortBy': sortBy,
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
      verifiedOnly: entity.verifiedOnly,
      availableOnly: entity.availableOnly,
      parking: entity.parking,
      sortBy: entity.sortBy,
    );
  }
}
