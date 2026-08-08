import '../../domain/entities/dashboard_summary_entity.dart';

class DashboardSummaryModel extends DashboardSummaryEntity {
  const DashboardSummaryModel({
    required super.totalProperties,
    required super.activeProperties,
    required super.totalViews,
    required super.pendingVisits,
    required super.completedVisits,
    required super.totalFavorites,
  });

  factory DashboardSummaryModel.fromJson(Map<String, dynamic> json) {
    return DashboardSummaryModel(
      totalProperties: json['totalProperties'] ?? 0,
      activeProperties: json['activeProperties'] ?? 0,
      totalViews: json['totalViews'] ?? 0,
      pendingVisits: json['pendingVisits'] ?? 0,
      completedVisits: json['completedVisits'] ?? 0,
      totalFavorites: json['totalFavorites'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalProperties': totalProperties,
      'activeProperties': activeProperties,
      'totalViews': totalViews,
      'pendingVisits': pendingVisits,
      'completedVisits': completedVisits,
      'totalFavorites': totalFavorites,
    };
  }

  DashboardSummaryModel copyWith({
    int? totalProperties,
    int? activeProperties,
    int? totalViews,
    int? pendingVisits,
    int? completedVisits,
    int? totalFavorites,
  }) {
    return DashboardSummaryModel(
      totalProperties: totalProperties ?? this.totalProperties,
      activeProperties: activeProperties ?? this.activeProperties,
      totalViews: totalViews ?? this.totalViews,
      pendingVisits: pendingVisits ?? this.pendingVisits,
      completedVisits: completedVisits ?? this.completedVisits,
      totalFavorites: totalFavorites ?? this.totalFavorites,
    );
  }
}
