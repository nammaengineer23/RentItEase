import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../features/authentication/providers/authentication_provider.dart';
import '../features/home/presentation/widgets/bottom_navigation.dart';
import '../core/network/dio_provider.dart';
import '../l10n/app_localizations.dart';

class AuthenticatedShell extends ConsumerStatefulWidget {
  const AuthenticatedShell({
    super.key,
    required this.location,
    required this.child,
  });

  final String location;
  final Widget child;

  @override
  ConsumerState<AuthenticatedShell> createState() =>
      _AuthenticatedShellState();
}

class _AuthenticatedShellState extends ConsumerState<AuthenticatedShell> {
  DateTime? _lastBackPress;

  static const _publicPaths = {
    '/splash',
    '/onboarding',
    '/auth',
    '/sign-in',
    '/register',
    '/forgot-password',
  };

  bool get _showNavigation => !_publicPaths.contains(widget.location);

  int get _selectedIndex {
    if (widget.location.startsWith('/search')) return 1;
    if (widget.location.startsWith('/favorites')) return 2;
    if (widget.location.startsWith('/my-bookings') ||
        widget.location.startsWith('/payment')) {
      return 3;
    }
    if (widget.location.startsWith('/profile') ||
        widget.location.startsWith('/settings')) {
      return 4;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    if (!_showNavigation) return widget.child;

    final role = ref
        .watch(authenticationProvider)
        .authResponse
        ?.user
        .role
        .trim()
        .toUpperCase();

    if (role == 'ADMIN') return widget.child;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) => _handleBack(role),
      child: Scaffold(
      body: widget.child,
      bottomNavigationBar: HomeBottomNavigation(
        currentIndex: _selectedIndex,
        ownerMode: role == 'OWNER',
        onTap: (index) {
          final destinations = <String>[
            role == 'OWNER' ? '/owner/dashboard' : '/home',
            '/search',
            role == 'OWNER' ? '/owner/analytics' : '/favorites',
            role == 'OWNER' ? '/owner/visit-requests' : '/my-bookings',
            '/profile',
          ];

          context.go(destinations[index]);
        },
      ),
      ),
    );
  }

  Future<void> _handleBack(String? role) async {
    if (context.canPop()) {
      context.pop();
      return;
    }

    final root = role == 'OWNER' ? '/owner/dashboard' : '/home';
    if (widget.location != root) {
      context.go(root);
      return;
    }

    final now = DateTime.now();
    if (_lastBackPress != null &&
        now.difference(_lastBackPress!) < const Duration(seconds: 2)) {
      final preferences = await SharedPreferences.getInstance();
      final hasRated = preferences.getBool('app_rating_submitted') ?? false;
      if (!hasRated && mounted) {
        await _showRatingPrompt(preferences);
        return;
      }
      SystemNavigator.pop();
      return;
    }

    _lastBackPress = now;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.tr('backAgain')),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _showRatingPrompt(SharedPreferences preferences) async {
    var rating = 5;
    final commentController = TextEditingController();

    final action = await showDialog<String>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(context.tr('rateApp')),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(context.tr('experienceQuestion')),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var star = 1; star <= 5; star++)
                      IconButton(
                        onPressed: () => setDialogState(() => rating = star),
                        icon: Icon(
                          star <= rating ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                        ),
                      ),
                  ],
                ),
                TextField(
                  controller: commentController,
                  maxLines: 3,
                  maxLength: 2000,
                  decoration: InputDecoration(
                    labelText: context.tr('commentsOptional'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, 'later'),
              child: Text(context.tr('later')),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, 'submit'),
              child: Text(context.tr('submit')),
            ),
          ],
        ),
      ),
    );

    if (action == 'submit') {
      try {
        await ref.read(dioProvider).post('/app-feedback', data: {
          'rating': rating,
          'comment': commentController.text.trim(),
          'platform': 'android',
        });
        await preferences.setBool('app_rating_submitted', true);

        if (rating >= 4) {
          await launchUrl(
            Uri.parse('market://details?id=com.rentitease.app'),
            mode: LaunchMode.externalApplication,
          );
        }
      } catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${context.tr('unableSaveRating')}: $error')),
          );
        }
      }
    }

    commentController.dispose();
  }
}
