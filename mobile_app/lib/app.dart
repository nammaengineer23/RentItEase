import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app_router.dart';
import 'app/app_theme.dart';
import 'core/navigation/route_persistence_service.dart';
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

class _RentItEaseAppState extends ConsumerState<RentItEaseApp>
    with WidgetsBindingObserver {
  DateTime? _backgroundedAt;
  bool _resumeRefreshInProgress = false;
  int _webSurfaceGeneration = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(_restoreSessionAndRoute);
  }

  Future<void> _restoreSessionAndRoute() async {
    final auth = ref.read(authenticationProvider);
    await auth.loadSavedSession();

    if (!mounted || !kIsWeb || !auth.isLoggedIn) return;

    final startupPath = Uri.base.path.replaceFirst(RegExp(r'/$'), '');
    if (startupPath.isNotEmpty) return;

    final role = auth.authResponse?.user.role.trim().toUpperCase();
    final previousRoute = await RoutePersistenceService.loadForRole(role);
    if (!mounted || previousRoute == null) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) AppRouter.router.go(previousRoute);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted) return;

    switch (state) {
      case AppLifecycleState.inactive:
      case AppLifecycleState.paused:
      case AppLifecycleState.hidden:
        _backgroundedAt ??= DateTime.now();
        break;
      case AppLifecycleState.resumed:
        unawaited(_refreshAfterResume());
        break;
      case AppLifecycleState.detached:
        break;
    }
  }

  Future<void> _refreshAfterResume() async {
    if (_resumeRefreshInProgress || !mounted) return;
    _resumeRefreshInProgress = true;

    try {
      final wasBackgrounded = _backgroundedAt != null;
      _backgroundedAt = null;

      if (kIsWeb && wasBackgrounded) {
        // Mobile browsers can discard or lose Flutter's web rendering surface
        // while a tab is backgrounded. Refreshing GoRouter alone leaves the
        // same MaterialApp/renderer attached and can therefore remain black.
        // Re-establish the session and replace the router application subtree
        // so Flutter creates a fresh rendering surface without changing the
        // current URL/route.
        await ref.read(authenticationProvider).loadSavedSession();
        if (!mounted) return;
        _webSurfaceGeneration++;
        WidgetsBinding.instance.ensureVisualUpdate();
        WidgetsBinding.instance.scheduleWarmUpFrame();
      }

      if (!mounted) return;
      setState(() {});
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) AppRouter.router.refresh();
      });
    } finally {
      _resumeRefreshInProgress = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final legalPath = Uri.base.path.replaceFirst(RegExp(r'/$'), '');
    if (const {
      '/about',
      '/contact',
      '/privacy-policy',
      '/terms',
      '/terms-of-service',
      '/delete-account',
    }.contains(legalPath)) {
      return LegalDocumentPage(path: legalPath);
    }

    final auth = ref.watch(authenticationProvider);

    // Web session restoration performs storage and network work. It must not
    // replace the entire application with an indefinite spinner while those
    // operations finish. Render the public/router shell immediately on web;
    // when restoration completes the provider notification rebuilds the app
    // with the authenticated session and _restoreSessionAndRoute restores the
    // user's last safe route.
    if (!kIsWeb && !auth.isSessionRestored) {
      return const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    final userSettings = auth.isLoggedIn
        ? ref.watch(settingsProvider).valueOrNull
        : null;
    final darkMode = userSettings?.darkMode ?? false;
    final language = userSettings?.language ?? 'en';

    return MaterialApp.router(
      key: kIsWeb ? ValueKey(_webSurfaceGeneration) : null,
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
