import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app_router.dart';
import 'app/app_theme.dart';
import 'features/settings/providers/settings_provider.dart';
import 'l10n/app_localizations.dart';

class RentItEaseApp extends ConsumerWidget {
  const RentItEaseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
