import 'package:dio/dio.dart';

import '../models/notification_model.dart';

class NotificationsApi {
NotificationsApi(this._dio);

final Dio _dio;

// =========================================
// Get All Notifications
// GET /notifications
// =========================================

Future<List<NotificationModel>> getNotifications() async {
try {
final response = await _dio.get('/notifications');

  final data = response.data;

  List<dynamic> list;

  if (data is List) {
    // Supports a raw list response.
    list = data;
  } else if (data is Map<String, dynamic>) {
    // Backend currently returns:
    // {
    //   total: ...,
    //   unread: ...,
    //   notifications: [...]
    // }
    final notifications = data['notifications'];

    if (notifications is List) {
      list = notifications;
    } else if (data['data'] is List) {
      // Compatibility with a wrapped `data` response.
      list = data['data'];
    } else {
      list = const [];
    }
  } else {
    list = const [];
  }

  return list
      .whereType<Map>()
      .map(
        (item) => NotificationModel.fromJson(
          Map<String, dynamic>.from(item),
        ),
      )
      .toList();
} on DioException catch (e) {
  throw Exception(
    e.response?.data?.toString() ??
        'Failed to load notifications.',
  );
}

}

// =========================================
// Get Unread Notification Count
// GET /notifications/unread-count
// =========================================

Future<int> getUnreadCount() async {
try {
final response = await _dio.get('/notifications/unread-count');


  final data = response.data;

  if (data is Map<String, dynamic>) {
    final unread = data['unread'];

    if (unread is int) {
      return unread;
    }

    if (unread is num) {
      return unread.toInt();
    }
  }

  return 0;
} on DioException catch (e) {
  throw Exception(
    e.response?.data?.toString() ??
        'Failed to load unread notification count.',
  );
}

}

// =========================================
// Mark Notification Read
// PATCH /notifications/:id/read
// =========================================

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

// =========================================
// Mark All Notifications Read
// PATCH /notifications/read-all
// =========================================

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

// =========================================
// Delete Notification
// DELETE /notifications/:id
// =========================================

Future<void> deleteNotification(String id) async {
try {
await _dio.delete('/notifications/$id');
} on DioException catch (e) {
throw Exception(
e.response?.data?.toString() ??
'Failed to delete notification.',
);
}
}
}
