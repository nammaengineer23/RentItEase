import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/profile_provider.dart';

import '../widgets/profile_header.dart';
import '../widgets/profile_menu_tile.dart';
import '../widgets/logout_dialog.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile'), centerTitle: true),

      body: profileState.when(
        loading: () => const Center(child: CircularProgressIndicator()),

        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,

            children: [
              const Icon(Icons.error_outline, size: 60, color: Colors.red),

              const SizedBox(height: 15),

              Text(error.toString(), textAlign: TextAlign.center),

              const SizedBox(height: 15),

              ElevatedButton(
                onPressed: () {
                  ref.read(profileProvider.notifier).loadProfile();
                },

                child: const Text('Retry'),
              ),
            ],
          ),
        ),

        data: (profile) {
          if (profile == null) {
            return const Center(child: Text('No profile found'));
          }

          return SingleChildScrollView(
            child: Column(
              children: [
                ProfileHeader(
                  profile: profile,

                  onEdit: () {
                    context.push('/profile/edit');
                  },
                ),

                const SizedBox(height: 15),

                ProfileMenuTile(
                  icon: Icons.home_work,

                  title: 'My Properties',

                  subtitle: 'Manage your listed properties',

                  onTap: () {
                    // TODO:
                    // Navigate Owner Dashboard
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.event,

                  title: 'My Visits',

                  subtitle: 'View property visit requests',

                  onTap: () {
                    // TODO:
                    // Navigate My Visits
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.favorite,

                  title: 'Favorites',

                  subtitle: 'Saved properties',

                  onTap: () {
                    // TODO:
                    // Navigate Favorites
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.settings,

                  title: 'Settings',

                  subtitle: 'App preferences and security',

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

                        if (!context.mounted) {
                          return;
                        }

                        context.go('/auth');
                      },
                    );
                  },
                ),

                const SizedBox(height: 30),
              ],
            ),
          );
        },
      ),
    );
  }
}
