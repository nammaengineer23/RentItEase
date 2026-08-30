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
      state = state.copyWith(loading: true, error: null);

      final summary = await repository.getDashboardSummary();

      final activities = await repository.getRecentActivities();

      state = state.copyWith(
        loading: false,
        summary: summary,
        activities: activities,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
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
      state = state.copyWith(loading: true, error: null);

      final analytics = await repository.getAnalytics();

      state = state.copyWith(loading: false, analytics: analytics, error: null);
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
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
      state = state.copyWith(loading: true, error: null);

      final properties = await repository.getMyProperties();

      state = state.copyWith(
        loading: false,
        properties: properties,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  // ==========================================================
  // Add Property
  // ==========================================================

  Future<OwnerPropertyEntity> addProperty(
    OwnerPropertyEntity property, {
    required double area,
    required int bathrooms,
    required int bedrooms,
    required String country,
    required String furnishing,
    String? landmark,
    double? latitude,
    double? longitude,
    required bool parking,
    required bool petFriendly,
    required String pincode,
    required double securityDeposit,
    required String stateName,
    bool dailyRentEnabled = false,
    double? dailyRent,
    List<String> amenityIds = const [],
  }) async {
    try {
      state = state.copyWith(loading: true, error: null);

      final createdProperty = await repository.addProperty(
        property,
        area: area,
        bathrooms: bathrooms,
        bedrooms: bedrooms,
        country: country,
        furnishing: furnishing,
        landmark: landmark,
        latitude: latitude,
        longitude: longitude,
        parking: parking,
        petFriendly: petFriendly,
        pincode: pincode,
        securityDeposit: securityDeposit,
        stateName: stateName,
        dailyRentEnabled: dailyRentEnabled,
        dailyRent: dailyRent,
        amenityIds: amenityIds,
      );

      await loadMyProperties();

      state = state.copyWith(error: null);
      return createdProperty;
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());

      rethrow;
    }
  }

  // ==========================================================
  // Update Property
  // ==========================================================

  Future<void> updateProperty(
    OwnerPropertyEntity property, {
    required double area,
    required int bathrooms,
    required int bedrooms,
    required String country,
    required String furnishing,
    String? landmark,
    double? latitude,
    double? longitude,
    required bool parking,
    required bool petFriendly,
    required String pincode,
    required double securityDeposit,
    required String stateName,
    bool dailyRentEnabled = false,
    double? dailyRent,
  }) async {
    try {
      state = state.copyWith(loading: true, error: null);

      await repository.updateProperty(
        property,
        area: area,
        bathrooms: bathrooms,
        bedrooms: bedrooms,
        country: country,
        furnishing: furnishing,
        landmark: landmark,
        latitude: latitude,
        longitude: longitude,
        parking: parking,
        petFriendly: petFriendly,
        pincode: pincode,
        securityDeposit: securityDeposit,
        stateName: stateName,
        dailyRentEnabled: dailyRentEnabled,
        dailyRent: dailyRent,
      );

      await loadMyProperties();

      state = state.copyWith(error: null);
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());

      rethrow;
    }
  }

  // ==========================================================
  // Delete Property
  // ==========================================================

  Future<void> deleteProperty(String propertyId) async {
    try {
      state = state.copyWith(loading: true, error: null);

      await repository.deleteProperty(propertyId);

      await loadMyProperties();

      state = state.copyWith(error: null);
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());

      rethrow;
    }
  }

  Future<void> refreshProperties() async {
    await loadMyProperties();
  }

  // ==========================================================
  // Visit Requests
  // ==========================================================

  Future<void> loadVisitRequests() async {
    try {
      state = state.copyWith(loading: true, error: null);

      final visits = await repository.getVisitRequests();

      state = state.copyWith(
        loading: false,
        visitRequests: visits,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<void> approveVisit(String visitId) async {
    try {
      state = state.copyWith(loading: true, error: null);

      await repository.approveVisit(visitId);

      await loadVisitRequests();
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());

      rethrow;
    }
  }

  Future<void> rejectVisit(String visitId) async {
    try {
      state = state.copyWith(loading: true, error: null);

      await repository.rejectVisit(visitId);

      await loadVisitRequests();
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());

      rethrow;
    }
  }

  Future<void> completeVisit(String visitId) async {
    try {
      state = state.copyWith(loading: true, error: null);

      await repository.completeVisit(visitId);

      await loadVisitRequests();
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());

      rethrow;
    }
  }

  Future<void> refreshVisitRequests() async {
    await loadVisitRequests();
  }
}
