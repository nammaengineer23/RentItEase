import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app_router.dart';
import 'app/app_theme.dart';
import 'core/ui/app_scroll_behavior.dart';
import 'features/authentication/providers/authentication_provider.dart';
import 'features/settings/providers/settings_provider.dart';
import 'features/legal/presentation/pages/legal_document_page.dart';
import 'l10n/app_localizations.dart';

class RentItEaseApp extends ConsumerStatefulWidget {
  const RentItEaseApp({super.key});

  @override
  ConsumerState<RentItEaseApp> createState() => _RentItEaseAppState();
}

class _RentItEaseAppState extends ConsumerState<RentItEaseApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(authenticationProvider).loadSavedSession(),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Flutter's PWA service worker can serve the app shell for a navigation
    // that was originally a public legal URL. Render those URLs explicitly so
    // they can never fall through to the onboarding router.
    final legalPath = Uri.base.path.replaceFirst(RegExp(r'/$'), '');
    if (const {'/about', '/contact', '/privacy-policy', '/terms', '/terms-of-service', '/delete-account'}
        .contains(legalPath)) {
      return LegalDocumentPage(path: legalPath);
    }

    final auth = ref.watch(authenticationProvider);
    if (!auth.isSessionRestored) {
      return const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    // Do not issue an authenticated settings request while a visitor is on
    // the public site or sign-in screen. This avoids unnecessary 401 retries
    // and lets the mobile web app render immediately.
    final userSettings = auth.isLoggedIn
        ? ref.watch(settingsProvider).valueOrNull
        : null;
    final darkMode = userSettings?.darkMode ?? false;
    final language = userSettings?.language ?? 'en';

    return MaterialApp.router(
      title: 'RentItEase',
      debugShowCheckedModeBanner: false,
      scrollBehavior: const AppScrollBehavior(),

      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: darkMode ? ThemeMode.dark : ThemeMode.light,
      locale: Locale(language),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      routerConfig: AppRouter.router,
    );
  }
}
