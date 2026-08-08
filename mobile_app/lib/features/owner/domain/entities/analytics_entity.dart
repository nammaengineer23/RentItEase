class AnalyticsMetricEntity {
  const AnalyticsMetricEntity({required this.month, required this.count});

  final String month;
  final int count;
}

class AnalyticsSummaryEntity {
  const AnalyticsSummaryEntity({
    required this.totalProperties,
    required this.availableProperties,
    required this.rentedProperties,
    required this.totalFavorites,
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
  final int totalVisits;

  final int pendingVisits;
  final int completedVisits;

  final double averageRating;
  final int totalReviews;
}

class AnalyticsEntity {
  const AnalyticsEntity({
    required this.summary,
    required this.monthlyVisits,
    required this.monthlyFavorites,
    required this.monthlyReviews,
  });

  final AnalyticsSummaryEntity summary;

  final List<AnalyticsMetricEntity> monthlyVisits;
  final List<AnalyticsMetricEntity> monthlyFavorites;
  final List<AnalyticsMetricEntity> monthlyReviews;
}
