import 'package:dio/dio.dart';

import '../../domain/entities/settings_entity.dart';
import '../../domain/repositories/settings_repository.dart';
import '../models/settings_model.dart';

class SettingsRepositoryImpl implements SettingsRepository {
  SettingsRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<SettingsEntity> getSettings() async {
    final response = await _dio.get('/settings');

    return SettingsModel.fromJson(_unwrapSettings(response.data));
  }

  @override
  Future<SettingsEntity> updateSettings({
    bool? pushNotifications,
    bool? emailNotifications,
    bool? smsNotifications,
    bool? darkMode,
    String? language,
  }) async {
    final data = <String, dynamic>{};

    if (pushNotifications != null) {
      data['pushNotifications'] = pushNotifications;
    }

    if (emailNotifications != null) {
      data['emailNotifications'] = emailNotifications;
    }

    if (smsNotifications != null) {
      data['smsNotifications'] = smsNotifications;
    }

    if (darkMode != null) {
      data['darkMode'] = darkMode;
    }

    if (language != null) {
      data['language'] = language;
    }

    final response = await _dio.patch('/settings', data: data);

    return SettingsModel.fromJson(_unwrapSettings(response.data));
  }

  Map<String, dynamic> _unwrapSettings(dynamic responseData) {
    if (responseData is! Map) {
      throw const FormatException('Invalid settings response.');
    }

    final outer = Map<String, dynamic>.from(responseData);
    final data = outer['data'];

    return data is Map
        ? Map<String, dynamic>.from(data)
        : outer;
  }

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _dio.patch(
      '/settings/password',
      data: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
  }

  @override
  Future<void> deleteAccount() async {
    await _dio.delete('/settings/account');
  }
}
