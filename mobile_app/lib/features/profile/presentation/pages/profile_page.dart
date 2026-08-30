import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/dio_provider.dart';

import '../../providers/profile_provider.dart';

import '../widgets/logout_dialog.dart';
import '../widgets/profile_header.dart';
import '../widgets/profile_menu_tile.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile'), centerTitle: true),
      body: profileState.when(
        loading: () => const Center(child: CircularProgressIndicator()),

        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 60, color: Colors.red),
                const SizedBox(height: 16),
                Text(error.toString(), textAlign: TextAlign.center),
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
            return const Center(child: Text('No profile found'));
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

                if (profile.role.trim().toUpperCase() == 'OWNER')
  ProfileMenuTile(
    icon: Icons.home_work,
    title: 'My Properties',
    subtitle: 'Manage your listed properties',
    onTap: () {
      context.push('/owner/properties');
    },
  ),

                if (profile.role.trim().toUpperCase() == 'USER')
                  ProfileMenuTile(
                    icon: Icons.storefront_outlined,
                    title: 'Become an Owner',
                    subtitle: 'Request admin approval to list properties',
                    onTap: () => _requestOwnerAccess(context, ref),
                  ),

                ProfileMenuTile(
                  icon: Icons.event,
                  title: profile.role.trim().toUpperCase() == 'OWNER'
                      ? 'Property Visits'
                      : 'My Visits',
                  subtitle: profile.role.trim().toUpperCase() == 'OWNER'
                      ? 'Manage visits requested for your properties'
                      : 'View booked property visits',
                  onTap: () {
                    if (profile.role.trim().toUpperCase() == 'OWNER') {
                      context.push('/owner/visit-requests');
                      return;
                    }
                    context.push('/my-visits');
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.favorite,
                  title: profile.role.trim().toUpperCase() == 'OWNER'
                      ? 'Property Favorites'
                      : 'Favorites',
                  subtitle: profile.role.trim().toUpperCase() == 'OWNER'
                      ? 'See engagement with your properties'
                      : 'Saved properties',
                  onTap: () {
                    if (profile.role.trim().toUpperCase() == 'OWNER') {
                      context.push('/owner/analytics');
                      return;
                    }
                    context.push('/favorites');
                  },
                ),

                ProfileMenuTile(
                  icon: Icons.workspace_premium_outlined,
                  title: 'Premium Membership',
                  subtitle: 'View plans, benefits and membership status',
                  onTap: () => context.push('/profile/premium'),
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

  Future<void> _requestOwnerAccess(
    BuildContext context,
    WidgetRef ref,
  ) async {
    try {
      await ref.read(dioProvider).patch('/users/request-owner');
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Owner request sent. Add your first property for admin review.',
          ),
        ),
      );
      // The role changes only after the administrator approves the request.
      // Do not navigate to an owner-only route while the account is still USER.
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to submit request: $error')),
      );
    }
  }

}
