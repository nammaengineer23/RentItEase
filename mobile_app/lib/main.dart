import 'dart:async';

import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(const ProviderScope(child: RentItEaseApp()));

  // App Check strengthens backend requests but must never hold the first
  // Flutter frame. Play Integrity may take time after a cold start or process
  // restoration, which previously left a blank launch surface until Android
  // killed the app. Activate it after rendering and allow Firebase to retry.
  unawaited(_activateAppCheck());
}

Future<void> _activateAppCheck() async {
  try {
    await FirebaseAppCheck.instance
        .activate(
          providerWeb: ReCaptchaEnterpriseProvider(
            '6LeUVawtAAAAAON8Mbvx2xNyYkpGv_LULjgRMF_A',
          ),
          providerAndroid: kDebugMode
              ? const AndroidDebugProvider()
              : const AndroidPlayIntegrityProvider(),
        )
        .timeout(const Duration(seconds: 10));
  } catch (error, stackTrace) {
    debugPrint('Firebase App Check activation deferred: $error');
    debugPrintStack(stackTrace: stackTrace);
  }
}
