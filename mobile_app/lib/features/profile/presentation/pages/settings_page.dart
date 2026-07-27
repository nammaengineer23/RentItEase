import 'package:flutter/material.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() =>
      _SettingsPageState();
}

class _SettingsPageState
    extends State<SettingsPage> {
  bool _darkMode = false;
  bool _notifications = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Settings"),
      ),
      body: ListView(
        children: [

          SwitchListTile(
            secondary: const Icon(
              Icons.dark_mode_outlined,
            ),
            title: const Text(
              "Dark Mode",
            ),
            subtitle: const Text(
              "Enable dark theme",
            ),
            value: _darkMode,
            onChanged: (value) {
              setState(() {
                _darkMode = value;
              });

              // TODO
              // Save theme preference
            },
          ),

          const Divider(height: 1),

          SwitchListTile(
            secondary: const Icon(
              Icons.notifications_outlined,
            ),
            title: const Text(
              "Notifications",
            ),
            subtitle: const Text(
              "Receive property alerts",
            ),
            value: _notifications,
            onChanged: (value) {
              setState(() {
                _notifications = value;
              });

              // TODO
              // Save notification preference
            },
          ),

          const Divider(height: 1),

          ListTile(
            leading: const Icon(
              Icons.language,
            ),
            title: const Text(
              "Language",
            ),
            subtitle: const Text(
              "English",
            ),
            trailing: const Icon(
              Icons.arrow_forward_ios,
              size: 16,
            ),
            onTap: () {
              // TODO
            },
          ),

          const Divider(height: 1),

          ListTile(
            leading: const Icon(
              Icons.privacy_tip_outlined,
            ),
            title: const Text(
              "Privacy Policy",
            ),
            trailing: const Icon(
              Icons.arrow_forward_ios,
              size: 16,
            ),
            onTap: () {
              // TODO
            },
          ),

          const Divider(height: 1),

          ListTile(
            leading: const Icon(
              Icons.support_agent,
            ),
            title: const Text(
              "Contact Support",
            ),
            trailing: const Icon(
              Icons.arrow_forward_ios,
              size: 16,
            ),
            onTap: () {
              // TODO
            },
          ),

          const Divider(height: 1),

          ListTile(
            leading: const Icon(
              Icons.info_outline,
            ),
            title: const Text(
              "About RentEase",
            ),
            subtitle: const Text(
              "Version 1.0.0",
            ),
            trailing: const Icon(
              Icons.arrow_forward_ios,
              size: 16,
            ),
            onTap: () {
              showAboutDialog(
                context: context,
                applicationName: "RentEase",
                applicationVersion: "1.0.0",
                applicationLegalese:
                    "© 2026 RentEase",
              );
            },
          ),
        ],
      ),
    );
  }
}