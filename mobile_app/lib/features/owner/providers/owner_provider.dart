import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/owner_api.dart';
import '../data/owner_repository.dart';
import '../../../core/network/dio_provider.dart';
import '../models/owner_property_model.dart';
import '../models/visit_request_model.dart';
import '../models/analytics_model.dart';

// ===============================
// Repository Provider
// ===============================

final ownerRepositoryProvider = Provider<OwnerRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return OwnerRepository(OwnerApi(dio));
});

// ===============================
// Owner State
// ===============================

class OwnerState {
  final bool isLoading;

  final List<OwnerPropertyModel> properties;

  final List<VisitRequestModel> visits;

  final AnalyticsModel? analytics;

  final String? error;

  OwnerState({
    this.isLoading = false,

    this.properties = const [],

    this.visits = const [],

    this.analytics,

    this.error,
  });

  OwnerState copyWith({
    bool? isLoading,

    List<OwnerPropertyModel>? properties,

    List<VisitRequestModel>? visits,

    AnalyticsModel? analytics,

    String? error,
  }) {
    return OwnerState(
      isLoading: isLoading ?? this.isLoading,

      properties: properties ?? this.properties,

      visits: visits ?? this.visits,

      analytics: analytics ?? this.analytics,

      error: error ?? this.error,
    );
  }
}

// ===============================
// Owner Notifier
// ===============================

class OwnerNotifier extends StateNotifier<OwnerState> {
  final OwnerRepository repository;

  OwnerNotifier(this.repository) : super(OwnerState());

  // ===========================
  // Load Properties
  // ===========================

  Future<void> loadProperties() async {
    state = state.copyWith(isLoading: true);

    try {
      final data = await repository.getMyProperties();

      state = state.copyWith(isLoading: false, properties: data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ===========================
  // Add Property
  // ===========================

  Future<void> addProperty(Map<String, dynamic> data) async {
    await repository.createProperty(data);

    await loadProperties();
  }

  // ===========================
  // Update Property
  // ===========================

  Future<void> updateProperty(String id, Map<String, dynamic> data) async {
    await repository.updateProperty(id, data);

    await loadProperties();
  }

  // ===========================
  // Delete Property
  // ===========================

  Future<void> deleteProperty(String id) async {
    await repository.deleteProperty(id);

    await loadProperties();
  }

  // ===========================
  // Visit Requests
  // ===========================

  Future<void> loadVisits() async {
    try {
      final data = await repository.getOwnerVisits();

      state = state.copyWith(visits: data);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> approveVisit(String id) async {
    await repository.approveVisit(id);

    await loadVisits();
  }

  Future<void> rejectVisit(String id) async {
    await repository.rejectVisit(id);

    await loadVisits();
  }

  Future<void> completeVisit(String id) async {
    await repository.completeVisit(id);

    await loadVisits();
  }

  // ===========================
  // Analytics
  // ===========================

  Future<void> loadAnalytics() async {
    try {
      final data = await repository.getAnalytics();

      state = state.copyWith(analytics: data);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

// ===============================
// Provider
// ===============================

final ownerProvider = StateNotifierProvider<OwnerNotifier, OwnerState>((ref) {
  final repository = ref.watch(ownerRepositoryProvider);

  return OwnerNotifier(repository);
});
