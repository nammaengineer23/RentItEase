import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

import '../data/api/owner_api.dart';
import '../data/repositories/owner_repository_impl.dart';

import '../domain/entities/owner_property_entity.dart';
import '../domain/repositories/owner_repository.dart';

import 'owner_state.dart';

final ownerRepositoryProvider = Provider<OwnerRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return OwnerRepositoryImpl(OwnerApi(dio));
});

final ownerProvider = StateNotifierProvider<OwnerNotifier, OwnerState>((ref) {
  return OwnerNotifier(ref.watch(ownerRepositoryProvider));
});

class OwnerNotifier extends StateNotifier<OwnerState> {
  OwnerNotifier(this.repository) : super(const OwnerState());

  final OwnerRepository repository;

  // ==========================================================
  // Dashboard
  // ==========================================================

  Future<void> loadDashboard() async {
    try {
      state = state.copyWith(
        loading: true,
        error: null,
      );

      final summary = await repository.getDashboardSummary();
      final activities = await repository.getRecentActivities();

      state = state.copyWith(
        loading: false,
        summary: summary,
        activities: activities,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> refreshDashboard() async {
    await loadDashboard();
  }

  // ==========================================================
  // Analytics
  // ==========================================================

  Future<void> loadAnalytics() async {
    try {
      state = state.copyWith(
        loading: true,
        error: null,
      );

      final analytics = await repository.getAnalytics();

      state = state.copyWith(
        loading: false,
        analytics: analytics,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> refreshAnalytics() async {
    await loadAnalytics();
  }

  // ==========================================================
  // Properties
  // ==========================================================

  Future<void> loadMyProperties() async {
    try {
      state = state.copyWith(
        loading: true,
        error: null,
      );

      final properties = await repository.getMyProperties();

      state = state.copyWith(
        loading: false,
        properties: properties,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> addProperty(OwnerPropertyEntity property) async {
    await repository.addProperty(property);
    await loadMyProperties();
  }

  Future<void> updateProperty(OwnerPropertyEntity property) async {
    await repository.updateProperty(property);
    await loadMyProperties();
  }

  Future<void> deleteProperty(String propertyId) async {
    await repository.deleteProperty(propertyId);
    await loadMyProperties();
  }

  Future<void> refreshProperties() async {
    await loadMyProperties();
  }

  // ==========================================================
  // Visit Requests
  // ==========================================================

  Future<void> loadVisitRequests() async {
    try {
      state = state.copyWith(
        loading: true,
        error: null,
      );

      final visits = await repository.getVisitRequests();

      state = state.copyWith(
        loading: false,
        visitRequests: visits,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> approveVisit(String visitId) async {
    await repository.approveVisit(visitId);
    await loadVisitRequests();
  }

  Future<void> rejectVisit(String visitId) async {
    await repository.rejectVisit(visitId);
    await loadVisitRequests();
  }

  Future<void> completeVisit(String visitId) async {
    await repository.completeVisit(visitId);
    await loadVisitRequests();
  }

  Future<void> refreshVisitRequests() async {
    await loadVisitRequests();
  }
}
