import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../widgets/profile_menu_tile.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings'), centerTitle: true),

      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(vertical: 10),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),

              child: Text(
                'Account',

                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),

            ProfileMenuTile(
              icon: Icons.lock_outline,

              title: 'Change Password',

              subtitle: 'Update your account password',

              onTap: () {
                // TODO:
                // Add change password page
              },
            ),

            ProfileMenuTile(
              icon: Icons.person_outline,

              title: 'Edit Profile',

              subtitle: 'Update your personal details',

              onTap: () {
                context.push('/profile/edit');
              },
            ),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 20),

              child: Text(
                'Preferences',

                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),

            ProfileMenuTile(
              icon: Icons.notifications,

              title: 'Notifications',

              subtitle: 'Manage push notification settings',

              onTap: () {
                // TODO:
                // Notification settings
              },
            ),

            ProfileMenuTile(
              icon: Icons.dark_mode,

              title: 'Theme',

              subtitle: 'Light / Dark mode',

              onTap: () {
                // TODO:
                // Theme provider
              },
            ),

            ProfileMenuTile(
              icon: Icons.language,

              title: 'Language',

              subtitle: 'Change app language',

              onTap: () {
                // TODO:
                // Language selection
              },
            ),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 20),

              child: Text(
                'Support',

                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),

            ProfileMenuTile(
              icon: Icons.help_outline,

              title: 'Help & Support',

              subtitle: 'Contact RentEase support',

              onTap: () {
                // TODO:
                // Open support page
              },
            ),

            ProfileMenuTile(
              icon: Icons.info_outline,

              title: 'About RentEase',

              subtitle: 'App version and information',

              onTap: () {
                showAboutDialog(
                  context: context,

                  applicationName: 'RentEase',

                  applicationVersion: '1.0.0',

                  applicationLegalese: 'Rental application platform',
                );
              },
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
