import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../widgets/profile_menu_tile.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.only(top: 12, bottom: 30),
        children: [
          //==================================================
          // Account
          //==================================================

          const Padding(
            padding: EdgeInsets.fromLTRB(18, 10, 18, 10),
            child: Text(
              'Account',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          ProfileMenuTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            subtitle: 'Update your personal details',
            onTap: () {
              context.push('/profile/edit');
            },
          ),

          ProfileMenuTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            subtitle: 'Update your account password',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Change Password module will be added soon.',
                  ),
                ),
              );
            },
          ),

          //==================================================
          // Preferences
          //==================================================

          const Padding(
            padding: EdgeInsets.fromLTRB(18, 24, 18, 10),
            child: Text(
              'Preferences',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          ProfileMenuTile(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            subtitle: 'Manage notification preferences',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Notification settings coming soon.',
                  ),
                ),
              );
            },
          ),

          ProfileMenuTile(
            icon: Icons.dark_mode_outlined,
            title: 'Theme',
            subtitle: 'Light / Dark Mode',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Theme switching will be available soon.',
                  ),
                ),
              );
            },
          ),

          ProfileMenuTile(
            icon: Icons.language_outlined,
            title: 'Language',
            subtitle: 'Choose application language',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Language selection coming soon.',
                  ),
                ),
              );
            },
          ),

          //==================================================
          // Support
          //==================================================

          const Padding(
            padding: EdgeInsets.fromLTRB(18, 24, 18, 10),
            child: Text(
              'Support',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          ProfileMenuTile(
            icon: Icons.help_outline,
            title: 'Help & Support',
            subtitle: 'Contact RentEase support',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Support module coming soon.',
                  ),
                ),
              );
            },
          ),

          ProfileMenuTile(
            icon: Icons.info_outline,
            title: 'About RentEase',
            subtitle: 'Version and application information',
            onTap: () {
              showAboutDialog(
                context: context,
                applicationName: 'RentEase',
                applicationVersion: '1.0.0',
                applicationIcon: const FlutterLogo(size: 48),
                applicationLegalese:
                    '© 2026 RentEase\nA modern rental property platform.',
              );
            },
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }
}