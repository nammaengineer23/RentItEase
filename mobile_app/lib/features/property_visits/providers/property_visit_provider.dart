import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/property_visit_repository_impl.dart';
import '../domain/entities/property_visit.dart';
import '../domain/repositories/property_visit_repository.dart';

final propertyVisitRepositoryProvider = Provider<PropertyVisitRepository>((
  ref,
) {
  return PropertyVisitRepositoryImpl();
});

final propertyVisitProvider =
    StateNotifierProvider<
      PropertyVisitNotifier,
      AsyncValue<List<PropertyVisit>>
    >((ref) {
      return PropertyVisitNotifier(ref.read(propertyVisitRepositoryProvider));
    });

class PropertyVisitNotifier
    extends StateNotifier<AsyncValue<List<PropertyVisit>>> {
  final PropertyVisitRepository repository;

  PropertyVisitNotifier(this.repository) : super(const AsyncLoading()) {
    loadMyVisits();
  }

  // ============================================
  // Tenant Visits
  // ============================================

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
    try {
      await repository.bookVisit(
        propertyId: propertyId,
        visitDate: visitDate,
        notes: notes,
      );

      await loadMyVisits();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> cancelVisit(String visitId) async {
    try {
      await repository.cancelVisit(visitId);

      await loadMyVisits();
    } catch (e) {
      rethrow;
    }
  }

  // ============================================
  // Owner Visits
  // ============================================

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
    try {
      await repository.approveVisit(visitId);

      await loadOwnerVisits();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> rejectVisit(String visitId) async {
    try {
      await repository.rejectVisit(visitId);

      await loadOwnerVisits();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> completeVisit(String visitId) async {
    try {
      await repository.completeVisit(visitId);

      await loadOwnerVisits();
    } catch (e) {
      rethrow;
    }
  }

  // ============================================
  // Helpers
  // ============================================

  Future<void> refreshMyVisits() async {
    await loadMyVisits();
  }

  Future<void> refreshOwnerVisits() async {
    await loadOwnerVisits();
  }
}
