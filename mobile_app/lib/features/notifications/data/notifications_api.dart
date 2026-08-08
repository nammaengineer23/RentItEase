import 'package:dio/dio.dart';

import '../models/notification_model.dart';

class NotificationsApi {
  NotificationsApi(this._dio);

  final Dio _dio;

  //=========================================
  // Get All Notifications
  // GET /notifications
  //=========================================

  Future<List<NotificationModel>> getNotifications() async {
    try {
      final response = await _dio.get('/notifications');

      final data = response.data;

      final list = data is List ? data : data['data'] ?? [];

      return List<NotificationModel>.from(
        list.map(
          (e) => NotificationModel.fromJson(
            Map<String, dynamic>.from(e),
          ),
        ),
      );
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ??
            'Failed to load notifications.',
      );
    }
  }

  //=========================================
  // Mark Notification Read
  // PATCH /notifications/:id/read
  //=========================================

  Future<void> markAsRead(String id) async {
    try {
      await _dio.patch('/notifications/$id/read');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ??
            'Failed to mark notification as read.',
      );
    }
  }

  //=========================================
  // Mark All Notifications Read
  // PATCH /notifications/read-all
  //=========================================

  Future<void> markAllAsRead() async {
    try {
      await _dio.patch('/notifications/read-all');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ??
            'Failed to mark all notifications as read.',
      );
    }
  }

  //=========================================
  // Delete Notification
  // DELETE /notifications/:id
  //=========================================

  Future<void> deleteNotification(String id) async {
    try {
      await _dio.delete('/notifications/$id');
    } on DioException catch (e) {
      throw Exception(
        e.response?.data.toString() ??
            'Failed to delete notification.',
      );
    }
  }
}