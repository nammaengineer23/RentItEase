import 'package:dio/dio.dart';

class AdminApi {
  AdminApi(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> getDashboard() async {
    return _map(await _dio.get<Map<String, dynamic>>('/admin/dashboard'));
  }

  Future<List<Map<String, dynamic>>> getUsers() async {
    return _list(await _dio.get<dynamic>('/admin/users'));
  }

  Future<List<Map<String, dynamic>>> getOwnerRequests() async {
    return _list(await _dio.get<dynamic>('/users/owner-requests'));
  }

  Future<void> reviewOwnerRequest(String id, bool approve) async {
    await _dio.patch<void>(
      '/users/$id/owner-request/${approve ? 'approve' : 'reject'}',
    );
  }

  Future<Map<String, dynamic>> getUser(String id) async {
    return _map(await _dio.get<Map<String, dynamic>>('/admin/users/$id'));
  }

  Future<void> setUserActive(String id, bool active) async {
    await _dio.patch<void>(
      '/admin/users/$id/${active ? 'activate' : 'deactivate'}',
    );
  }

  Future<void> deleteUser(String id) async {
    await _dio.delete<void>('/admin/users/$id');
  }

  Future<List<Map<String, dynamic>>> getProperties() async {
    return _list(await _dio.get<dynamic>('/admin/properties'));
  }

  Future<Map<String, dynamic>> getProperty(String id) async {
    return _map(await _dio.get<Map<String, dynamic>>('/admin/properties/$id'));
  }

  Future<void> setPropertyVisible(String id, bool visible) async {
    await _dio.patch<void>(
      '/admin/properties/$id/${visible ? 'unhide' : 'hide'}',
    );
  }

  Future<void> approveProperty(String id) async {
    await _dio.patch<void>('/admin/properties/$id/approve');
  }

  Future<void> markPropertyPremium(String propertyId, String ownerId) async {
    final response = await _dio.post<dynamic>(
      '/premium-listings/users/$ownerId',
      data: {
        'propertyId': propertyId,
        'durationDays': 30,
        'amount': 0,
        'currency': 'INR',
      },
    );
    dynamic value = _unwrap(response);
    if (value is Map && value['id'] != null) {
      await _dio.patch<void>('/premium-listings/${value['id']}/activate');
      return;
    }
    throw const FormatException('Invalid premium listing response.');
  }

  Future<void> deleteProperty(String id) async {
    await _dio.delete<void>('/admin/properties/$id');
  }

  Future<List<Map<String, dynamic>>> getReviews() async {
    return _list(await _dio.get<dynamic>('/admin/reviews'));
  }

  Future<void> deleteReview(String id) async {
    await _dio.delete<void>('/admin/reviews/$id');
  }

  Future<List<Map<String, dynamic>>> getVisits() async {
    return _list(await _dio.get<dynamic>('/admin/visits'));
  }

  Future<void> updateVisitStatus(String id, String action) async {
    await _dio.patch<void>('/admin/visits/$id/$action');
  }

  Future<Map<String, dynamic>> getAnalytics() async {
    return _map(await _dio.get<Map<String, dynamic>>('/admin/analytics'));
  }

  Future<List<Map<String, dynamic>>> getMemberships() async {
    return _list(await _dio.get<dynamic>('/admin/billing/memberships'));
  }

  Future<void> updateMembershipStatus(String id, String action) async {
    const allowedActions = {'activate', 'cancel', 'expire', 'renew'};
    if (!allowedActions.contains(action)) {
      throw ArgumentError.value(action, 'action', 'Unsupported membership action');
    }
    await _dio.patch<void>('/admin/billing/memberships/$id/$action');
  }


  Future<List<Map<String, dynamic>>> searchRecords(String query, {int limit = 20}) async {
    final result = _map(await _dio.get<dynamic>(
      '/admin/search',
      queryParameters: {'q': query, 'limit': limit},
    ));
    final items = result['results'];
    if (items is! List) return const [];
    return items.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList();
  }

  Future<Map<String, dynamic>> getBillingOverview() async =>
      _map(await _dio.get<dynamic>('/admin/billing/overview'));
  Future<List<Map<String, dynamic>>> getBillingPlans() async =>
      _list(await _dio.get<dynamic>('/admin/billing/plans', queryParameters: {'includeInactive': true}));
  Future<List<Map<String, dynamic>>> getPremiumListings() async =>
      _list(await _dio.get<dynamic>('/admin/billing/premium-listings'));
  Future<List<Map<String, dynamic>>> getPayments() async =>
      _list(await _dio.get<dynamic>('/admin/billing/payments'));
  Future<List<Map<String, dynamic>>> getInvoices() async =>
      _list(await _dio.get<dynamic>('/admin/billing/invoices'));

  Future<void> updatePlan(String id, Map<String, dynamic> data) async {
    await _dio.patch<void>('/admin/billing/plans/$id', data: data);
  }
  Future<void> deactivatePlan(String id) async {
    await _dio.patch<void>('/admin/billing/plans/$id/deactivate');
  }
  Future<void> extendMembership(String id, int days) async {
    await _dio.patch<void>('/admin/billing/memberships/$id/extend', data: {'days': days});
  }
  Future<void> changeMembershipPlan(String id, String planId) async {
    await _dio.patch<void>('/admin/billing/memberships/$id/plan', data: {'planId': planId});
  }
  Future<void> restoreMembership(String id) async {
    await _dio.patch<void>('/admin/billing/memberships/$id/restore');
  }
  Future<void> updatePremiumListingStatus(String id, String action) async {
    await _dio.patch<void>('/admin/billing/premium-listings/$id/$action');
  }
  Future<void> updateInvoiceStatus(String id, String action) async {
    await _dio.patch<void>('/admin/billing/invoices/$id/$action');
  }

  Future<List<Map<String, dynamic>>> getSocialPosts() async =>
      _list(await _dio.get<dynamic>('/admin/social-media/posts'));
  Future<List<Map<String, dynamic>>> getSocialPostHistory(String postId) async =>
      _list(await _dio.get<dynamic>('/admin/social-media/posts/$postId/history'));
  Future<void> retrySocialPost(String postId) async {
    await _dio.post<void>('/admin/social-media/posts/$postId/retry');
  }
  Future<void> cancelSocialPost(String postId) async {
    await _dio.post<void>('/admin/social-media/posts/$postId/cancel');
  }

  Future<List<Map<String, dynamic>>> getSocialProperties() async {
    return _list(await _dio.get<dynamic>('/admin/social-media/properties'));
  }

  Future<Map<String, dynamic>> getSocialAnalytics() async {
    return _map(await _dio.get<dynamic>('/admin/social-media/analytics'));
  }

  Future<Map<String, dynamic>> getSocialSettings() async {
    return _map(await _dio.get<dynamic>('/admin/social-media/settings'));
  }

  Future<Map<String, dynamic>> generateSocialMedia(
    String propertyId, {
    required List<String> platforms,
  }) async {
    return _map(
      await _dio.post<dynamic>(
        '/admin/social-media/generate',
        data: {
          'propertyId': propertyId,
          'platforms': platforms,
          'autoPublish': false,
        },
      ),
    );
  }

  Future<void> publishSocialMedia(
    String propertyId,
    String platform, {
    String? caption,
    String? title,
  }) async {
    final result = _map(
      await _dio.post<dynamic>(
        '/admin/social-media/properties/$propertyId/publish',
        data: {
          'platform': platform,
          'caption': ?caption,
          'title': ?title,
        },
      ),
    );
    final status = result['status']?.toString().toUpperCase();
    if (status != 'PUBLISHED') {
      final message = result['error']?.toString().trim();
      throw StateError(
        message?.isNotEmpty == true
            ? '$platform publish failed: $message'
            : '$platform publish was not confirmed by the platform.',
      );
    }
    final externalId = result['externalId']?.toString().trim();
    if (externalId == null || externalId.isEmpty) {
      throw StateError('$platform did not return a published post ID.');
    }
  }

  Future<void> scheduleSocialMedia(
    String propertyId,
    String platform,
    DateTime scheduledAt, {
    String? caption,
    String? title,
  }) async {
    await _dio.post<void>(
      '/admin/social-media/properties/$propertyId/schedule',
      data: {
        'platform': platform,
        'scheduledAt': scheduledAt.toUtc().toIso8601String(),
        'caption': ?caption,
        'title': ?title,
      },
    );
  }

  dynamic _unwrap(Response<dynamic> response) {
    dynamic value = response.data;
    for (var depth = 0; depth < 5; depth++) {
      if (value is Map && value['data'] != null) {
        value = value['data'];
      } else {
        break;
      }
    }
    return value;
  }

  Map<String, dynamic> _map(Response<dynamic> response) {
    final value = _unwrap(response);
    if (value is Map) return Map<String, dynamic>.from(value);
    throw const FormatException('Invalid admin response.');
  }

  List<Map<String, dynamic>> _list(Response<dynamic> response) {
    final value = _unwrap(response);
    if (value is! List) {
      throw const FormatException('Invalid admin list response.');
    }
    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }
}
