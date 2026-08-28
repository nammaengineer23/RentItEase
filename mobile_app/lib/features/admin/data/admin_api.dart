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

  Future<List<Map<String, dynamic>>> getSocialProperties() async {
    return _list(await _dio.get<dynamic>('/admin/social-media/properties'));
  }

  Future<Map<String, dynamic>> getSocialAnalytics() async {
    return _map(await _dio.get<dynamic>('/admin/social-media/analytics'));
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
