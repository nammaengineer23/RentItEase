import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/profile_provider.dart';

import '../../../favorites/presentation/pages/favorites_page.dart';
import '../../../owner/presentation/pages/my_properties_page.dart';
import '../../../property_visits/presentation/pages/my_visits_page.dart';
import '../widgets/logout_dialog.dart';
import '../widgets/profile_header.dart';
import '../widgets/profile_menu_tile.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        centerTitle: true,
      ),
      body: profileState.when(
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),

        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 60,
                  color: Colors.red,
                ),
                const SizedBox(height: 16),
                Text(
                  error.toString(),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    ref.read(profileProvider.notifier).loadProfile();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),

        data: (profile) {
          if (profile == null) {
            return const Center(
              child: Text('No profile found'),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(profileProvider.notifier).refresh();
            },
            child: ListView(
              children: [
                ProfileHeader(
                  profile: profile,
                  onEdit: () {
                    context.push('/profile/edit');
                  },
                ),

                const SizedBox(height: 12),

                ProfileMenuTile(
                  icon: Icons.home_work,
                  title: 'My Properties',
                  subtitle: 'Manage your listed properties',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const MyPropertiesPage(),
                      ),
                    );
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.event,
                  title: 'My Visits',
                  subtitle: 'View booked property visits',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const MyVisitsPage(),
                      ),
                    );
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.favorite,
                  title: 'Favorites',
                  subtitle: 'Saved properties',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const FavoritesPage(),
                      ),
                    );
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.settings,
                  title: 'Settings',
                  subtitle: 'App preferences',
                  onTap: () {
                    context.push('/profile/settings');
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.logout,
                  title: 'Logout',
                  color: Colors.red,
                  onTap: () {
                    LogoutDialog.show(
                      context,
                      onConfirm: () async {
                        await ref.read(profileProvider.notifier).logout();

                        if (!context.mounted) return;

                        context.go('/auth');
                      },
                    );
                  },
                ),

                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}