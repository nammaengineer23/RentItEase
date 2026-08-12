import 'package:flutter/material.dart';

import '../domain/entities/settings_entity.dart';

class SettingsCard extends StatelessWidget {
  const SettingsCard({super.key, required this.settings});

  final SettingsEntity settings;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          _SettingTile(
            icon: Icons.notifications_outlined,
            title: 'Push Notifications',
            subtitle: 'Receive notifications on your device',
            value: settings.pushNotifications,
          ),
          const Divider(height: 1),
          _SettingTile(
            icon: Icons.email_outlined,
            title: 'Email Notifications',
            subtitle: 'Receive important updates by email',
            value: settings.emailNotifications,
          ),
          const Divider(height: 1),
          _SettingTile(
            icon: Icons.sms_outlined,
            title: 'SMS Notifications',
            subtitle: 'Receive important updates by SMS',
            value: settings.smsNotifications,
          ),
          const Divider(height: 1),
          _SettingTile(
            icon: Icons.dark_mode_outlined,
            title: 'Dark Mode',
            subtitle: 'Use a dark appearance throughout the app',
            value: settings.darkMode,
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Language'),
            subtitle: Text(
              settings.language == 'en' ? 'English' : settings.language,
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: Icon(
        value ? Icons.toggle_on : Icons.toggle_off,
        size: 32,
        color: value ? Theme.of(context).colorScheme.primary : Colors.grey,
      ),
    );
  }
}
