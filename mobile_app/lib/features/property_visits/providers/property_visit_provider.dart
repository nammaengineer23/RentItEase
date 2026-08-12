import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

import '../data/api/property_visit_api.dart';
import '../data/repositories/property_visit_repository_impl.dart';
import '../domain/entities/property_visit.dart';
import '../domain/repositories/property_visit_repository.dart';

// ==================================================
// Repository Provider
// ==================================================

final propertyVisitRepositoryProvider = Provider<PropertyVisitRepository>((
  ref,
) {
  final dio = ref.watch(dioProvider);

  return PropertyVisitRepositoryImpl(PropertyVisitApi(dio));
});

// ==================================================
// Provider
// ==================================================

final propertyVisitProvider =
    StateNotifierProvider<
      PropertyVisitNotifier,
      AsyncValue<List<PropertyVisit>>
    >((ref) {
      return PropertyVisitNotifier(ref.watch(propertyVisitRepositoryProvider));
    });

// ==================================================
// Notifier
// ==================================================

class PropertyVisitNotifier
    extends StateNotifier<AsyncValue<List<PropertyVisit>>> {
  PropertyVisitNotifier(this.repository) : super(const AsyncLoading()) {
    loadMyVisits();
  }

  final PropertyVisitRepository repository;

  // ==================================================
  // Tenant Visits
  // ==================================================

  Future<void> loadMyVisits() async {
    try {
      state = const AsyncLoading();

      final visits = await repository.getMyVisits();

      state = AsyncData(visits);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> bookVisit({
    required String propertyId,
    required DateTime visitDate,
    String? notes,
  }) async {
    await repository.bookVisit(
      propertyId: propertyId,
      visitDate: visitDate,
      notes: notes,
    );

    await loadMyVisits();
  }

  Future<void> cancelVisit(String visitId) async {
    await repository.cancelVisit(visitId);

    await loadMyVisits();
  }

  // ==================================================
  // Owner Visits
  // ==================================================

  Future<void> loadOwnerVisits() async {
    try {
      state = const AsyncLoading();

      final visits = await repository.getOwnerVisits();

      state = AsyncData(visits);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> approveVisit(String visitId) async {
    await repository.approveVisit(visitId);

    await loadOwnerVisits();
  }

  Future<void> rejectVisit(String visitId) async {
    await repository.rejectVisit(visitId);

    await loadOwnerVisits();
  }

  Future<void> completeVisit(String visitId) async {
    await repository.completeVisit(visitId);

    await loadOwnerVisits();
  }

  // ==================================================
  // Refresh Helpers
  // ==================================================

  Future<void> refreshMyVisits() async {
    await loadMyVisits();
  }

  Future<void> refreshOwnerVisits() async {
    await loadOwnerVisits();
  }
}
