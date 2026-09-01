class AnalyticsModel {
  const AnalyticsModel({
    required this.summary,
    required this.monthlyVisits,
    required this.monthlyFavorites,
    required this.monthlyReviews,
  });

  final AnalyticsSummaryModel summary;

  final List<MonthlyAnalyticsModel> monthlyVisits;
  final List<MonthlyAnalyticsModel> monthlyFavorites;
  final List<MonthlyAnalyticsModel> monthlyReviews;

  // Convenience getters used by the Owner Analytics UI.
  int get totalProperties => summary.totalProperties;

  int get totalFavorites => summary.totalFavorites;

  int get totalVisits => summary.totalVisits;

  int get pendingVisits => summary.pendingVisits;

  int get completedVisits => summary.completedVisits;

  int get totalReviews => summary.totalReviews;

  double get averageRating => summary.averageRating;

  int get availableProperties => summary.availableProperties;

  int get rentedProperties => summary.rentedProperties;

  int get totalViews => summary.totalViews;

  factory AnalyticsModel.fromJson(Map<String, dynamic> json) {
    final summaryJson = json['summary'];

    return AnalyticsModel(
      summary: AnalyticsSummaryModel.fromJson(
        summaryJson is Map
            ? Map<String, dynamic>.from(summaryJson)
            : <String, dynamic>{},
      ),
      monthlyVisits: _parseMonthlyList(json['monthlyVisits']),
      monthlyFavorites: _parseMonthlyList(json['monthlyFavorites']),
      monthlyReviews: _parseMonthlyList(json['monthlyReviews']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'summary': summary.toJson(),
      'monthlyVisits': monthlyVisits.map((item) => item.toJson()).toList(),
      'monthlyFavorites': monthlyFavorites
          .map((item) => item.toJson())
          .toList(),
      'monthlyReviews': monthlyReviews.map((item) => item.toJson()).toList(),
    };
  }

  static List<MonthlyAnalyticsModel> _parseMonthlyList(dynamic value) {
    if (value is! List) {
      return const [];
    }

    return value
        .whereType<Map>()
        .map(
          (item) =>
              MonthlyAnalyticsModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }
}

// ==========================================================
// Analytics Summary
// ==========================================================

class AnalyticsSummaryModel {
  const AnalyticsSummaryModel({
    required this.totalProperties,
    required this.availableProperties,
    required this.rentedProperties,
    required this.totalFavorites,
    required this.totalViews,
    required this.totalVisits,
    required this.pendingVisits,
    required this.completedVisits,
    required this.averageRating,
    required this.totalReviews,
  });

  final int totalProperties;
  final int availableProperties;
  final int rentedProperties;

  final int totalFavorites;
  final int totalViews;
  final int totalVisits;

  final int pendingVisits;
  final int completedVisits;

  final double averageRating;
  final int totalReviews;

  factory AnalyticsSummaryModel.fromJson(Map<String, dynamic> json) {
    return AnalyticsSummaryModel(
      totalProperties: _toInt(json['totalProperties']),
      availableProperties: _toInt(json['availableProperties']),
      rentedProperties: _toInt(json['rentedProperties']),
      totalFavorites: _toInt(json['totalFavorites']),
      totalViews: _toInt(json['totalViews']),
      totalVisits: _toInt(json['totalVisits']),
      pendingVisits: _toInt(json['pendingVisits']),
      completedVisits: _toInt(json['completedVisits']),
      averageRating: _toDouble(json['averageRating']),
      totalReviews: _toInt(json['totalReviews']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalProperties': totalProperties,
      'availableProperties': availableProperties,
      'rentedProperties': rentedProperties,
      'totalFavorites': totalFavorites,
      'totalViews': totalViews,
      'totalVisits': totalVisits,
      'pendingVisits': pendingVisits,
      'completedVisits': completedVisits,
      'averageRating': averageRating,
      'totalReviews': totalReviews,
    };
  }

  static int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static double _toDouble(dynamic value) {
    if (value is double) {
      return value;
    }

    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }
}

// ==========================================================
// Monthly Analytics
// ==========================================================

class MonthlyAnalyticsModel {
  const MonthlyAnalyticsModel({required this.month, required this.count});

  final String month;
  final int count;

  factory MonthlyAnalyticsModel.fromJson(Map<String, dynamic> json) {
    return MonthlyAnalyticsModel(
      month: json['month']?.toString() ?? '',
      count: _toInt(json['count']),
    );
  }

  Map<String, dynamic> toJson() {
    return {'month': month, 'count': count};
  }

  static int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
