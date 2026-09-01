import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

import '../data/repositories/settings_repository_impl.dart';
import '../domain/entities/settings_entity.dart';
import '../domain/repositories/settings_repository.dart';
import '../../notifications/services/push_notification_service.dart';

// ============================================================
// Repository Provider
// ============================================================

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return SettingsRepositoryImpl(dio);
});

// ============================================================
// Settings Provider
// ============================================================

final settingsProvider =
    AsyncNotifierProvider<SettingsNotifier, SettingsEntity>(
      SettingsNotifier.new,
    );

// ============================================================
// Settings Notifier
// ============================================================

class SettingsNotifier extends AsyncNotifier<SettingsEntity> {
  SettingsRepository get _repository => ref.read(settingsRepositoryProvider);
  final PushNotificationService _pushNotificationService =
      PushNotificationService();

  @override
  Future<SettingsEntity> build() async {
    return _repository.getSettings();
  }

  // ==========================================================
  // Update Settings
  // ==========================================================

  Future<void> updateSettings({
    bool? pushNotifications,
    bool? emailNotifications,
    bool? smsNotifications,
    bool? darkMode,
    String? language,
  }) async {
    final current = state.valueOrNull;

    if (current == null) {
      return;
    }

    // Keep the current UI data while the API request is running.
    state = AsyncData(
      SettingsEntity(
        pushNotifications: pushNotifications ?? current.pushNotifications,
        emailNotifications: emailNotifications ?? current.emailNotifications,
        smsNotifications: smsNotifications ?? current.smsNotifications,
        darkMode: darkMode ?? current.darkMode,
        language: language ?? current.language,
      ),
    );

    try {
      final updated = await _repository.updateSettings(
        pushNotifications: pushNotifications,
        emailNotifications: emailNotifications,
        smsNotifications: smsNotifications,
        darkMode: darkMode,
        language: language,
      );

      state = AsyncData(updated);
      if (pushNotifications == true) {
        await _pushNotificationService.activate();
      } else if (pushNotifications == false) {
        await _pushNotificationService.deactivate();
      }
    } catch (e, st) {
      // Restore the previous server state if the request fails.
      state = AsyncError(e, st);
    }
  }

  // ==========================================================
  // Change Password
  // ==========================================================

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _repository.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }

  // ==========================================================
  // Delete Account
  // ==========================================================

  Future<void> deleteAccount() async {
    await _repository.deleteAccount();
  }

  // ==========================================================
  // Refresh
  // ==========================================================

  Future<void> refresh() async {
    state = const AsyncLoading();

    state = await AsyncValue.guard(_repository.getSettings);
  }
}
