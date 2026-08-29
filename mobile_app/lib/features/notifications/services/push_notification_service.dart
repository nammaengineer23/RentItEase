import 'dart:async';

import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';

class PushNotificationService {
  PushNotificationService({FirebaseMessaging? messaging, Dio? dio})
    : _providedMessaging = messaging,
      _dio = dio ?? ApiClient.shared.dio;

  final FirebaseMessaging? _providedMessaging;
  final Dio _dio;
  StreamSubscription<String>? _tokenRefreshSubscription;

  FirebaseMessaging get _messaging =>
      _providedMessaging ?? FirebaseMessaging.instance;

  Future<bool> activate() async {
    try {
      final permission = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      if (permission.authorizationStatus == AuthorizationStatus.denied) {
        return false;
      }

      final token = await _messaging.getToken();
      if (token == null || token.isEmpty) return false;
      await _register(token);

      await _tokenRefreshSubscription?.cancel();
      _tokenRefreshSubscription = _messaging.onTokenRefresh.listen(
        (nextToken) => _register(nextToken),
        onError: (_) {},
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> deactivate() async {
    try {
      final token = await _messaging.getToken();
      if (token != null && token.isNotEmpty) {
        await _dio.delete(
          '/push-notifications/unregister',
          data: {'token': token},
        );
      }
      await _tokenRefreshSubscription?.cancel();
      _tokenRefreshSubscription = null;
      await _messaging.deleteToken();
    } catch (_) {
      // Logout and preference changes still complete if FCM is unavailable.
    }
  }

  Future<void> _register(String token) async {
    await _dio.post(
      '/push-notifications/register',
      data: {'token': token, 'platform': _platformName},
    );
  }

  String get _platformName {
    if (kIsWeb) return 'web';
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => 'android',
      TargetPlatform.iOS => 'ios',
      TargetPlatform.macOS => 'macos',
      TargetPlatform.windows => 'windows',
      TargetPlatform.linux => 'linux',
      TargetPlatform.fuchsia => 'fuchsia',
    };
  }
}
