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
      totalProperties: _toInt(json['totalProperties']),
      activeProperties: _toInt(json['activeProperties']),
      totalViews: _toInt(json['totalViews']),
      pendingVisits: _toInt(json['pendingVisits']),
      completedVisits: _toInt(json['completedVisits']),
      totalFavorites: _toInt(json['totalFavorites']),
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

  static int _toInt(dynamic value) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
