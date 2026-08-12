import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/settings_entity.dart';
import '../../providers/settings_provider.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsState = ref.watch(settingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: settingsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),

        error: (error, _) => _ErrorView(
          error: error,
          onRetry: () {
            ref.invalidate(settingsProvider);
          },
        ),

        data: (SettingsEntity settings) {
          return _SettingsContent(settings: settings);
        },
      ),
    );
  }
}

// ============================================================
// Settings Content
// ============================================================

class _SettingsContent extends ConsumerWidget {
  const _SettingsContent({required this.settings});

  final SettingsEntity settings;

  Future<void> _updateSetting(
    BuildContext context,
    WidgetRef ref, {
    bool? pushNotifications,
    bool? emailNotifications,
    bool? smsNotifications,
    bool? darkMode,
    String? language,
  }) async {
    try {
      await ref
          .read(settingsProvider.notifier)
          .updateSettings(
            pushNotifications: pushNotifications,
            emailNotifications: emailNotifications,
            smsNotifications: smsNotifications,
            darkMode: darkMode,
            language: language,
          );

      if (!context.mounted) {
        return;
      }

      final state = ref.read(settingsProvider);

      if (state.hasError) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(state.error.toString())));
      }
    } catch (e) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _showChangePasswordDialog(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    try {
      await showDialog<void>(
        context: context,
        builder: (dialogContext) {
          bool obscureCurrent = true;
          bool obscureNew = true;
          bool obscureConfirm = true;
          bool loading = false;

          return StatefulBuilder(
            builder: (context, setState) {
              return AlertDialog(
                title: const Text('Change Password'),
                content: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextField(
                        controller: currentPasswordController,
                        obscureText: obscureCurrent,
                        decoration: InputDecoration(
                          labelText: 'Current Password',
                          border: const OutlineInputBorder(),
                          suffixIcon: IconButton(
                            onPressed: () {
                              setState(() {
                                obscureCurrent = !obscureCurrent;
                              });
                            },
                            icon: Icon(
                              obscureCurrent
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: newPasswordController,
                        obscureText: obscureNew,
                        decoration: InputDecoration(
                          labelText: 'New Password',
                          helperText: 'Minimum 8 characters',
                          border: const OutlineInputBorder(),
                          suffixIcon: IconButton(
                            onPressed: () {
                              setState(() {
                                obscureNew = !obscureNew;
                              });
                            },
                            icon: Icon(
                              obscureNew
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: confirmPasswordController,
                        obscureText: obscureConfirm,
                        decoration: InputDecoration(
                          labelText: 'Confirm New Password',
                          border: const OutlineInputBorder(),
                          suffixIcon: IconButton(
                            onPressed: () {
                              setState(() {
                                obscureConfirm = !obscureConfirm;
                              });
                            },
                            icon: Icon(
                              obscureConfirm
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: loading
                        ? null
                        : () {
                            Navigator.pop(dialogContext);
                          },
                    child: const Text('Cancel'),
                  ),
                  FilledButton(
                    onPressed: loading
                        ? null
                        : () async {
                            final currentPassword = currentPasswordController
                                .text
                                .trim();

                            final newPassword = newPasswordController.text
                                .trim();

                            final confirmPassword = confirmPasswordController
                                .text
                                .trim();

                            if (currentPassword.isEmpty ||
                                newPassword.isEmpty ||
                                confirmPassword.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Please fill all password fields.',
                                  ),
                                ),
                              );
                              return;
                            }

                            if (newPassword.length < 8) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'New password must be at least 8 characters.',
                                  ),
                                ),
                              );
                              return;
                            }

                            if (newPassword != confirmPassword) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('New passwords do not match.'),
                                ),
                              );
                              return;
                            }

                            setState(() {
                              loading = true;
                            });

                            try {
                              await ref
                                  .read(settingsProvider.notifier)
                                  .changePassword(
                                    currentPassword: currentPassword,
                                    newPassword: newPassword,
                                  );

                              if (!context.mounted) {
                                return;
                              }

                              Navigator.pop(dialogContext);

                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Password changed successfully.',
                                  ),
                                ),
                              );
                            } catch (e) {
                              if (!context.mounted) {
                                return;
                              }

                              setState(() {
                                loading = false;
                              });

                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString())),
                              );
                            }
                          },
                    child: loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Change Password'),
                  ),
                ],
              );
            },
          );
        },
      );
    } finally {
      currentPasswordController.dispose();
      newPasswordController.dispose();
      confirmPasswordController.dispose();
    }
  }

  Future<void> _deleteAccount(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete Account'),
          content: const Text(
            'This will permanently delete your account and its data. '
            'This action cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext, false);
              },
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogContext, true);
              },
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    try {
      await ref.read(settingsProvider.notifier).deleteAccount();

      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account deleted successfully.')),
      );

      // Authentication/logout navigation will be connected here
      // once the existing authentication/session provider is confirmed.
    } catch (e) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(settingsProvider.notifier).refresh();
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Preferences',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 8),

          Text(
            'Customize your RentItEase experience.',
            style: TextStyle(color: Colors.grey.shade700),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Notifications
          // ==================================================
          const _SectionTitle(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
          ),

          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.notifications),
                  title: const Text('Push Notifications'),
                  subtitle: const Text('Receive notifications on your device'),
                  value: settings.pushNotifications,
                  onChanged: (value) {
                    _updateSetting(context, ref, pushNotifications: value);
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.email_outlined),
                  title: const Text('Email Notifications'),
                  subtitle: const Text('Receive important updates by email'),
                  value: settings.emailNotifications,
                  onChanged: (value) {
                    _updateSetting(context, ref, emailNotifications: value);
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.sms_outlined),
                  title: const Text('SMS Notifications'),
                  subtitle: const Text('Receive important updates by SMS'),
                  value: settings.smsNotifications,
                  onChanged: (value) {
                    _updateSetting(context, ref, smsNotifications: value);
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Appearance
          // ==================================================
          const _SectionTitle(
            icon: Icons.palette_outlined,
            title: 'Appearance',
          ),

          Card(
            child: SwitchListTile(
              secondary: const Icon(Icons.dark_mode_outlined),
              title: const Text('Dark Mode'),
              subtitle: const Text('Use a dark appearance throughout the app'),
              value: settings.darkMode,
              onChanged: (value) {
                _updateSetting(context, ref, darkMode: value);
              },
            ),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Language
          // ==================================================
          const _SectionTitle(icon: Icons.language, title: 'Language'),

          Card(
            child: ListTile(
              leading: const Icon(Icons.translate),
              title: const Text('App Language'),
              subtitle: Text(
                settings.language == 'en' ? 'English' : settings.language,
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                final language = await showModalBottomSheet<String>(
                  context: context,
                  builder: (context) {
                    return SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const ListTile(
                            title: Text(
                              'Select Language',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          ListTile(
                            leading: const Icon(Icons.language),
                            title: const Text('English'),
                            trailing: settings.language == 'en'
                                ? const Icon(Icons.check)
                                : null,
                            onTap: () {
                              Navigator.pop(context, 'en');
                            },
                          ),
                        ],
                      ),
                    );
                  },
                );

                if (language == null || !context.mounted) {
                  return;
                }

                await _updateSetting(context, ref, language: language);
              },
            ),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Security
          // ==================================================
          const _SectionTitle(icon: Icons.security_outlined, title: 'Security'),

          Card(
            child: ListTile(
              leading: const Icon(Icons.lock_outline),
              title: const Text('Change Password'),
              subtitle: const Text('Update your account password'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                _showChangePasswordDialog(context, ref);
              },
            ),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Danger Zone
          // ==================================================
          const _SectionTitle(
            icon: Icons.warning_amber_outlined,
            title: 'Account',
          ),

          Card(
            child: ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.red),
              title: const Text(
                'Delete Account',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: const Text(
                'Permanently delete your RentItEase account',
              ),
              trailing: const Icon(Icons.chevron_right, color: Colors.red),
              onTap: () {
                _deleteAccount(context, ref);
              },
            ),
          ),

          const SizedBox(height: 40),

          Center(
            child: Text(
              'RentItEase Settings',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

// ============================================================
// Section Title
// ============================================================

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// Error View
// ============================================================

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 70, color: Colors.red),
            const SizedBox(height: 20),
            const Text(
              'Unable to load settings.',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(error.toString(), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
