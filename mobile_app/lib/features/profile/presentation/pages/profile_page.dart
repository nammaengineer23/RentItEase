import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/profile_provider.dart';
import '../widgets/logout_dialog.dart';
import '../widgets/profile_header.dart';
import '../widgets/profile_menu_tile.dart';
import 'edit_profile_page.dart';
import 'settings_page.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(profileProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ProfileHeader(
              user: user,
              onEditPhoto: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Change profile photo coming soon',
                    ),
                  ),
                );
              },
            ),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.only(
                  top: 16,
                  bottom: 30,
                ),
                children: [
                  ProfileMenuTile(
                    icon: Icons.person_outline,
                    title: 'Edit Profile',
                    subtitle: 'Update your personal details',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const EditProfilePage(),
                        ),
                      );
                    },
                  ),

                  ProfileMenuTile(
                    icon: Icons.favorite_border,
                    title: 'Favorites',
                    subtitle: 'Saved properties',
                    onTap: () {
                      // TODO
                    },
                  ),

                  ProfileMenuTile(
                    icon: Icons.calendar_month_outlined,
                    title: 'My Bookings',
                    subtitle: 'Property visit bookings',
                    onTap: () {
                      // TODO
                    },
                  ),

                  if (user.isOwner)
                    ProfileMenuTile(
                      icon: Icons.home_work_outlined,
                      title: 'My Properties',
                      subtitle: 'Manage listed properties',
                      onTap: () {
                        // TODO
                      },
                    ),

                  ProfileMenuTile(
                    icon: Icons.settings_outlined,
                    title: 'Settings',
                    subtitle: 'App preferences',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const SettingsPage(),
                        ),
                      );
                    },
                  ),

                  ProfileMenuTile(
                    icon: Icons.logout,
                    title: 'Logout',
                    iconColor: Colors.red,
                    textColor: Colors.red,
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => LogoutDialog(
                          onLogout: () {
                            ref
                                .read(profileProvider.notifier)
                                .logout();
                          },
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}