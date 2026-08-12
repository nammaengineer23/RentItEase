import '../models/notification_model.dart';
import 'notifications_api.dart';

class NotificationsRepository {
  NotificationsRepository(this._api);

  final NotificationsApi _api;

  //=========================================
  // Get Notifications
  //=========================================

  Future<List<NotificationModel>> getNotifications() async {
    return _api.getNotifications();
  }

  //=========================================
  // Mark Notification as Read
  //=========================================

  Future<void> markAsRead(String id) async {
    await _api.markAsRead(id);
  }

  //=========================================
  // Mark All Notifications as Read
  //=========================================

  Future<void> markAllAsRead() async {
    await _api.markAllAsRead();
  }

  //=========================================
  // Delete Notification
  //=========================================

  Future<void> deleteNotification(String id) async {
    await _api.deleteNotification(id);
  }
}
