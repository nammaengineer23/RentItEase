import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app_router.dart';
import 'app/app_theme.dart';
import 'features/settings/providers/settings_provider.dart';
import 'features/legal/presentation/pages/legal_document_page.dart';
import 'l10n/app_localizations.dart';

class RentItEaseApp extends ConsumerWidget {
  const RentItEaseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Flutter's PWA service worker can serve the app shell for a navigation
    // that was originally a public legal URL. Render those URLs explicitly so
    // they can never fall through to the onboarding router.
    final legalPath = Uri.base.path.replaceFirst(RegExp(r'/$'), '');
    if (const {'/privacy-policy', '/terms', '/terms-of-service', '/delete-account'}
        .contains(legalPath)) {
      return LegalDocumentPage(path: legalPath);
    }

    final settingsAsync = ref.watch(settingsProvider);

    final darkMode = settingsAsync.valueOrNull?.darkMode ?? false;
    final language = settingsAsync.valueOrNull?.language ?? 'en';

    return MaterialApp.router(
      title: 'RentItEase',
      debugShowCheckedModeBanner: false,

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
