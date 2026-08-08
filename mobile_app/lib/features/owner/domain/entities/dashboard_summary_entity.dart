class DashboardSummaryEntity {
  const DashboardSummaryEntity({
    required this.totalProperties,
    required this.activeProperties,
    required this.totalViews,
    required this.pendingVisits,
    required this.completedVisits,
    required this.totalFavorites,
  });

  final int totalProperties;
  final int activeProperties;
  final int totalViews;
  final int pendingVisits;
  final int completedVisits;
  final int totalFavorites;
}
