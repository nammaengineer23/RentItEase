import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/notifications_api.dart';
import '../data/notifications_repository.dart';
import '../models/notification_model.dart';

//=========================================
// Repository Provider
//=========================================

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return NotificationsRepository(
    NotificationsApi(dio),
  );
});

//=========================================
// Notifications State
//=========================================

class NotificationsState {
  final bool isLoading;

  final List<NotificationModel> notifications;

  final String? error;

  const NotificationsState({
    this.isLoading = false,
    this.notifications = const [],
    this.error,
  });

  int get unreadCount =>
      notifications.where((e) => !e.isRead).length;

  NotificationsState copyWith({
    bool? isLoading,
    List<NotificationModel>? notifications,
    String? error,
  }) {
    return NotificationsState(
      isLoading: isLoading ?? this.isLoading,
      notifications: notifications ?? this.notifications,
      error: error,
    );
  }
}

//=========================================
// Notifications Notifier
//=========================================

class NotificationsNotifier
    extends StateNotifier<NotificationsState> {
  NotificationsNotifier(this._repository)
      : super(const NotificationsState());

  final NotificationsRepository _repository;

  //=========================================
  // Load Notifications
  //=========================================

  Future<void> loadNotifications() async {
    state = state.copyWith(
      isLoading: true,
      error: null,
    );

    try {
      final notifications =
          await _repository.getNotifications();

      state = state.copyWith(
        isLoading: false,
        notifications: notifications,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  //=========================================
  // Refresh
  //=========================================

  Future<void> refresh() async {
    await loadNotifications();
  }

  //=========================================
  // Mark One Notification Read
  //=========================================

  Future<void> markAsRead(String id) async {
    try {
      await _repository.markAsRead(id);

      await loadNotifications();
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
      );
    }
  }

  //=========================================
  // Mark All Notifications Read
  //=========================================

  Future<void> markAllAsRead() async {
    try {
      await _repository.markAllAsRead();

      await loadNotifications();
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
      );
    }
  }

  //=========================================
  // Delete Notification
  //=========================================

  Future<void> deleteNotification(String id) async {
    try {
      await _repository.deleteNotification(id);

      await loadNotifications();
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
      );
    }
  }

  //=========================================
  // Clear Error
  //=========================================

  void clearError() {
    state = state.copyWith(
      error: null,
    );
  }
}

//=========================================
// Provider
//=========================================

final notificationsProvider = StateNotifierProvider<
    NotificationsNotifier,
    NotificationsState>((ref) {
  return NotificationsNotifier(
    ref.watch(notificationsRepositoryProvider),
  );
});