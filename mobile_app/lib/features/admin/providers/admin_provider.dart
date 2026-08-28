import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/admin_api.dart';

final adminApiProvider = Provider<AdminApi>(
  (ref) => AdminApi(ref.watch(dioProvider)),
);

final adminProvider = StateNotifierProvider<AdminNotifier, AdminState>(
  (ref) => AdminNotifier(ref.watch(adminApiProvider)),
);

class AdminState {
  const AdminState({
    this.loading = false,
    this.error,
    this.dashboard = const {},
    this.users = const [],
    this.ownerRequests = const [],
    this.properties = const [],
    this.reviews = const [],
    this.visits = const [],
    this.analytics = const {},
    this.memberships = const [],
    this.socialProperties = const [],
    this.socialAnalytics = const {},
  });

  final bool loading;
  final String? error;
  final Map<String, dynamic> dashboard;
  final List<Map<String, dynamic>> users;
  final List<Map<String, dynamic>> ownerRequests;
  final List<Map<String, dynamic>> properties;
  final List<Map<String, dynamic>> reviews;
  final List<Map<String, dynamic>> visits;
  final Map<String, dynamic> analytics;
  final List<Map<String, dynamic>> memberships;
  final List<Map<String, dynamic>> socialProperties;
  final Map<String, dynamic> socialAnalytics;

  AdminState copyWith({
    bool? loading,
    String? error,
    bool clearError = false,
    Map<String, dynamic>? dashboard,
    List<Map<String, dynamic>>? users,
    List<Map<String, dynamic>>? ownerRequests,
    List<Map<String, dynamic>>? properties,
    List<Map<String, dynamic>>? reviews,
    List<Map<String, dynamic>>? visits,
    Map<String, dynamic>? analytics,
    List<Map<String, dynamic>>? memberships,
    List<Map<String, dynamic>>? socialProperties,
    Map<String, dynamic>? socialAnalytics,
  }) {
    return AdminState(
      loading: loading ?? this.loading,
      error: clearError ? null : error ?? this.error,
      dashboard: dashboard ?? this.dashboard,
      users: users ?? this.users,
      ownerRequests: ownerRequests ?? this.ownerRequests,
      properties: properties ?? this.properties,
      reviews: reviews ?? this.reviews,
      visits: visits ?? this.visits,
      analytics: analytics ?? this.analytics,
      memberships: memberships ?? this.memberships,
      socialProperties: socialProperties ?? this.socialProperties,
      socialAnalytics: socialAnalytics ?? this.socialAnalytics,
    );
  }
}

class AdminNotifier extends StateNotifier<AdminState> {
  AdminNotifier(this._api) : super(const AdminState());

  final AdminApi _api;

  Future<void> loadDashboard() async {
    await _load(
      () async => state = state.copyWith(
        dashboard: await _api.getDashboard(),
      ),
    );
  }

  Future<void> loadUsers() async {
    await _load(
      () async => state = state.copyWith(
        users: await _api.getUsers(),
        ownerRequests: await _api.getOwnerRequests(),
      ),
    );
  }

  Future<void> reviewOwnerRequest(String id, bool approve) async {
    await _action(() => _api.reviewOwnerRequest(id, approve), loadUsers);
  }

  Future<void> loadProperties() async {
    await _load(
      () async => state = state.copyWith(
        properties: await _api.getProperties(),
      ),
    );
  }

  Future<void> loadReviews() async {
    await _load(
      () async => state = state.copyWith(reviews: await _api.getReviews()),
    );
  }

  Future<void> loadVisits() async {
    await _load(
      () async => state = state.copyWith(visits: await _api.getVisits()),
    );
  }

  Future<void> loadAnalytics() async {
    await _load(
      () async {
        final results = await Future.wait<Map<String, dynamic>>([
          _api.getAnalytics(),
          _api.getSocialAnalytics(),
        ]);
        state = state.copyWith(
          analytics: results[0],
          socialAnalytics: results[1],
        );
      },
    );
  }

  Future<void> loadMemberships() async {
    await _load(
      () async => state = state.copyWith(
        memberships: await _api.getMemberships(),
      ),
    );
  }

  Future<void> loadSocialMedia() async {
    await _load(
      () async => state = state.copyWith(
        socialProperties: await _api.getSocialProperties(),
      ),
    );
  }

  Future<Map<String, dynamic>> getUser(String id) => _api.getUser(id);

  Future<Map<String, dynamic>> getProperty(String id) =>
      _api.getProperty(id);

  Future<void> setUserActive(String id, bool active) async {
    await _action(() => _api.setUserActive(id, active), loadUsers);
  }

  Future<void> deleteUser(String id) async {
    await _action(() => _api.deleteUser(id), loadUsers);
  }

  Future<void> setPropertyVisible(String id, bool visible) async {
    await _action(
      () => _api.setPropertyVisible(id, visible),
      loadProperties,
    );
  }

  Future<void> approveProperty(String id) async {
    await _action(() => _api.approveProperty(id), loadProperties);
  }

  Future<void> markPropertyPremium(String propertyId, String ownerId) async {
    await _action(
      () => _api.markPropertyPremium(propertyId, ownerId),
      loadProperties,
    );
  }

  Future<void> deleteProperty(String id) async {
    await _action(() => _api.deleteProperty(id), loadProperties);
  }

  Future<void> deleteReview(String id) async {
    await _action(() => _api.deleteReview(id), loadReviews);
  }

  Future<void> updateVisitStatus(String id, String action) async {
    await _action(
      () => _api.updateVisitStatus(id, action),
      loadVisits,
    );
  }

  Future<void> _action(
    Future<void> Function() action,
    Future<void> Function() reload,
  ) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await action();
      await reload();
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> _load(Future<void> Function() loader) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await loader();
      state = state.copyWith(loading: false, clearError: true);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }
}
