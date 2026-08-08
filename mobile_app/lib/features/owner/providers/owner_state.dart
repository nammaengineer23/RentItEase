import '../data/models/analytics_model.dart';
import '../domain/entities/activity_entity.dart';
import '../domain/entities/dashboard_summary_entity.dart';
import '../domain/entities/owner_property_entity.dart';
import '../domain/entities/visit_request_entity.dart';

class OwnerState {
  const OwnerState({
    this.loading = false,
    this.summary,
    this.analytics,
    this.activities = const [],
    this.properties = const [],
    this.visitRequests = const [],
    this.error,
  });

  final bool loading;

  final DashboardSummaryEntity? summary;

  final AnalyticsModel? analytics;

  final List<ActivityEntity> activities;

  final List<OwnerPropertyEntity> properties;

  final List<VisitRequestEntity> visitRequests;

  final String? error;

  bool get isLoading => loading;

  OwnerState copyWith({
    bool? loading,
    DashboardSummaryEntity? summary,
    AnalyticsModel? analytics,
    List<ActivityEntity>? activities,
    List<OwnerPropertyEntity>? properties,
    List<VisitRequestEntity>? visitRequests,
    String? error,
  }) {
    return OwnerState(
      loading: loading ?? this.loading,
      summary: summary ?? this.summary,
      analytics: analytics ?? this.analytics,
      activities: activities ?? this.activities,
      properties: properties ?? this.properties,
      visitRequests: visitRequests ?? this.visitRequests,
      error: error,
    );
  }
}
