import 'dart:async';

import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';\nimport 'config/environment.dart';
import 'firebase_options.dart';

const _appCheckWebSiteKey = String.fromEnvironment(
  'APP_CHECK_WEB_SITE_KEY',
  defaultValue: '6LeUVawtAAAAAON8Mbvx2xNyYkpGv_LULjgRMF_A',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final useNativeStagingFirebase =\n      Environment.isStaging &&\n      !kIsWeb &&\n      defaultTargetPlatform == TargetPlatform.android;\n\n  if (useNativeStagingFirebase) {\n    // Android Gradle selects android/app/src/staging/google-services.json.\n    await Firebase.initializeApp();\n  } else {\n    // Preserve the existing production Firebase configuration everywhere else.\n    await Firebase.initializeApp(\n      options: DefaultFirebaseOptions.currentPlatform,\n    );\n  }

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
          providerWeb: kDebugMode
              ? WebDebugProvider()
              : ReCaptchaEnterpriseProvider(_appCheckWebSiteKey),
          providerAndroid: kDebugMode
              ? const AndroidDebugProvider()
              : const AndroidPlayIntegrityProvider(),
          providerApple: kDebugMode
              ? const AppleDebugProvider()
              : const AppleAppAttestWithDeviceCheckFallbackProvider(),
        )
        .timeout(const Duration(seconds: 10));
    await FirebaseAppCheck.instance.setTokenAutoRefreshEnabled(true);
  } catch (error, stackTrace) {
    debugPrint('Firebase App Check activation deferred: $error');
    debugPrintStack(stackTrace: stackTrace);
  }
}
