import 'package:dio/dio.dart';

import '../models/notification_model.dart';

class NotificationsApi {
  NotificationsApi(this._dio);

  final Dio _dio;

  Future<List<NotificationModel>> getNotifications() async {
    try {
      final response = await _dio.get('/notifications');
      final list = _extractNotifications(response.data);

      return list
          .whereType<Map>()
          .map(
            (item) => NotificationModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .where((notification) => notification.id.isNotEmpty)
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ?? 'Failed to load notifications.',
      );
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/notifications/unread-count');
      return _extractUnreadCount(response.data);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ??
            'Failed to load unread notification count.',
      );
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _dio.patch('/notifications/$id/read');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ??
            'Failed to mark notification as read.',
      );
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _dio.patch('/notifications/read-all');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ??
            'Failed to mark all notifications as read.',
      );
    }
  }

  Future<void> deleteNotification(String id) async {
    try {
      await _dio.delete('/notifications/$id');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?.toString() ?? 'Failed to delete notification.',
      );
    }
  }

  static List<dynamic> _extractNotifications(dynamic response) {
    dynamic value = response;

    for (var depth = 0; depth < 6; depth++) {
      if (value is List) return value;
      if (value is! Map) break;

      final notifications = value['notifications'];
      if (notifications is List) return notifications;

      if (!value.containsKey('data')) break;
      value = value['data'];
    }

    return const [];
  }

  static int _extractUnreadCount(dynamic response) {
    dynamic value = response;

    for (var depth = 0; depth < 6; depth++) {
      if (value is! Map) break;

      final unread = value['unread'] ?? value['unreadCount'];
      if (unread is num) return unread.toInt();
      final parsed = int.tryParse(unread?.toString() ?? '');
      if (parsed != null) return parsed;

      if (!value.containsKey('data')) break;
      value = value['data'];
    }

    return 0;
  }
}
