import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/entities/settings_entity.dart';
import '../../providers/settings_provider.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../core/utils/app_error_message.dart';
import '../../../authentication/providers/authentication_provider.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authenticationProvider);
    if (!auth.isSessionRestored) {
      return Scaffold(
        appBar: AppBar(title: Text(context.tr('settings'))),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final settingsState = ref.watch(settingsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('settings'))),
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
        ).showSnackBar(SnackBar(content: Text(userFriendlyError(state.error))));
      }
    } catch (e) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(userFriendlyError(e))));
    }
  }

  // Retained temporarily for source compatibility; the lifecycle-safe dialog
  // below is the active implementation.
  // ignore: unused_element
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
                title: Text(context.tr('changePassword')),
                content: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextField(
                        controller: currentPasswordController,
                        obscureText: obscureCurrent,
                        decoration: InputDecoration(
                          labelText: context.tr('currentPassword'),
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
                          labelText: context.tr('newPassword'),
                          helperText: context.tr('minimum8Characters'),
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
                          labelText: context.tr('confirmNewPassword'),
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
                    child: Text(context.tr('cancel')),
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
                                SnackBar(
                                  content: Text(
                                    context.tr('fillPasswordFields'),
                                  ),
                                ),
                              );
                              return;
                            }

                            if (newPassword.length < 8) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(context.tr('passwordMinimum')),
                                ),
                              );
                              return;
                            }

                            if (newPassword != confirmPassword) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(context.tr('passwordMismatch')),
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
                                SnackBar(
                                  content: Text(context.tr('passwordChanged')),
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
                                SnackBar(content: Text(userFriendlyError(e))),
                              );
                            }
                          },
                    child: loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(context.tr('changePassword')),
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
          title: Text(context.tr('deleteAccount')),
          content: Text(context.tr('deleteAccountWarning')),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext, false);
              },
              child: Text(context.tr('cancel')),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogContext, true);
              },
              child: Text(context.tr('delete')),
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

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.tr('accountDeleted'))));

      // Authentication/logout navigation will be connected here
      // once the existing authentication/session provider is confirmed.
    } catch (e) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(userFriendlyError(e))));
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
          Text(
            context.tr('preferences'),
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 8),

          Text(
            context.tr('customizeExperience'),
            style: TextStyle(color: Colors.grey.shade700),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Notifications
          // ==================================================
          _SectionTitle(
            icon: Icons.notifications_outlined,
            title: context.tr('notifications'),
          ),

          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.notifications),
                  title: Text(context.tr('pushNotifications')),
                  subtitle: Text(context.tr('pushDescription')),
                  value: settings.pushNotifications,
                  onChanged: (value) {
                    _updateSetting(context, ref, pushNotifications: value);
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.email_outlined),
                  title: Text(context.tr('emailNotifications')),
                  subtitle: Text(context.tr('emailDescription')),
                  value: settings.emailNotifications,
                  onChanged: (value) {
                    _updateSetting(context, ref, emailNotifications: value);
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.sms_outlined),
                  title: Text(context.tr('smsNotifications')),
                  subtitle: Text(context.tr('smsDescription')),
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
          _SectionTitle(
            icon: Icons.palette_outlined,
            title: context.tr('appearance'),
          ),

          Card(
            child: SwitchListTile(
              secondary: const Icon(Icons.dark_mode_outlined),
              title: Text(context.tr('darkMode')),
              subtitle: Text(context.tr('darkModeDescription')),
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
          _SectionTitle(icon: Icons.language, title: context.tr('language')),

          Card(
            child: ListTile(
              leading: const Icon(Icons.translate),
              title: Text(context.tr('appLanguage')),
              subtitle: Text(
                AppLocalizations.languageNames[settings.language] ??
                    settings.language,
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
                          ListTile(
                            title: Text(
                              context.tr('selectLanguage'),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          for (final entry
                              in AppLocalizations.languageNames.entries)
                            ListTile(
                              leading: const Icon(Icons.language),
                              title: Text(entry.value),
                              trailing: settings.language == entry.key
                                  ? const Icon(Icons.check)
                                  : null,
                              onTap: () => Navigator.pop(context, entry.key),
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

          _SectionTitle(
            icon: Icons.support_agent,
            title: context.tr('contactUs'),
          ),

          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.business_outlined),
                  title: Text(context.tr('generalEnquiries')),
                  subtitle: const Text('contact@rentitease.com'),
                  trailing: const Icon(Icons.open_in_new),
                  onTap: () => _openContact(
                    context,
                    Uri.parse('mailto:contact@rentitease.com'),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.support_outlined),
                  title: Text(context.tr('customerSupport')),
                  subtitle: const Text('support@rentitease.com'),
                  trailing: const Icon(Icons.open_in_new),
                  onTap: () => _openContact(
                    context,
                    Uri.parse('mailto:support@rentitease.com'),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.phone_outlined),
                  title: Text(context.tr('callUs')),
                  subtitle: const Text('+91 99863 85925'),
                  trailing: const Icon(Icons.call),
                  onTap: () =>
                      _openContact(context, Uri.parse('tel:+919986385925')),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language_outlined),
                  title: Text(context.tr('website')),
                  subtitle: const Text('rentitease.com'),
                  trailing: const Icon(Icons.open_in_new),
                  onTap: () => _openContact(
                    context,
                    Uri.parse('https://rentitease.com'),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Security
          // ==================================================
          _SectionTitle(
            icon: Icons.security_outlined,
            title: context.tr('security'),
          ),

          Card(
            child: ListTile(
              leading: const Icon(Icons.lock_outline),
              title: Text(context.tr('changePassword')),
              subtitle: Text(context.tr('updatePassword')),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                showDialog<void>(
                  context: context,
                  builder: (_) => const _ChangePasswordDialog(),
                );
              },
            ),
          ),

          const SizedBox(height: 24),

          // ==================================================
          // Danger Zone
          // ==================================================
          _SectionTitle(
            icon: Icons.warning_amber_outlined,
            title: context.tr('account'),
          ),

          Card(
            child: ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.red),
              title: Text(
                context.tr('deleteAccount'),
                style: const TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text(context.tr('deleteAccountDescription')),
              trailing: const Icon(Icons.chevron_right, color: Colors.red),
              onTap: () {
                _deleteAccount(context, ref);
              },
            ),
          ),

          const SizedBox(height: 40),

          Center(
            child: Text(
              context.tr('settingsFooter'),
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Future<void> _openContact(BuildContext context, Uri uri) async {
    if (await launchUrl(uri, mode: LaunchMode.externalApplication)) return;
    if (!context.mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(context.tr('unableOpenContact'))));
  }
}

// ============================================================
// Section Title
// ============================================================

class _ChangePasswordDialog extends ConsumerStatefulWidget {
  const _ChangePasswordDialog();

  @override
  ConsumerState<_ChangePasswordDialog> createState() =>
      _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends ConsumerState<_ChangePasswordDialog> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirmation = TextEditingController();
  bool _currentObscured = true;
  bool _nextObscured = true;
  bool _confirmationObscured = true;
  bool _loading = false;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirmation.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final current = _current.text.trim();
    final next = _next.text.trim();
    final confirmation = _confirmation.text.trim();
    final messenger = ScaffoldMessenger.of(context);
    final passwordChangedMessage = context.tr('passwordChanged');
    String? validationError;
    if (current.isEmpty || next.isEmpty || confirmation.isEmpty) {
      validationError = context.tr('fillPasswordFields');
    } else if (next.length < 8) {
      validationError = context.tr('passwordMinimum');
    } else if (next != confirmation) {
      validationError = context.tr('passwordMismatch');
    }
    if (validationError != null) {
      messenger.showSnackBar(SnackBar(content: Text(validationError)));
      return;
    }

    setState(() => _loading = true);
    try {
      await ref.read(settingsProvider.notifier).changePassword(
            currentPassword: current,
            newPassword: next,
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      messenger.showSnackBar(
        SnackBar(content: Text(passwordChangedMessage)),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _loading = false);
      messenger.showSnackBar(
        SnackBar(content: Text(userFriendlyError(error))),
      );
    }
  }

  InputDecoration _decoration(
    String label,
    bool obscured,
    VoidCallback onToggle,
  ) {
    return InputDecoration(
      labelText: label,
      border: const OutlineInputBorder(),
      suffixIcon: IconButton(
        onPressed: onToggle,
        icon: Icon(obscured ? Icons.visibility : Icons.visibility_off),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(context.tr('changePassword')),
      content: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
            controller: _current,
            obscureText: _currentObscured,
            decoration: _decoration(
              context.tr('currentPassword'),
              _currentObscured,
              () => setState(() => _currentObscured = !_currentObscured),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _next,
            obscureText: _nextObscured,
            decoration: _decoration(
              context.tr('newPassword'),
              _nextObscured,
              () => setState(() => _nextObscured = !_nextObscured),
            ).copyWith(helperText: context.tr('minimum8Characters')),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _confirmation,
            obscureText: _confirmationObscured,
            onSubmitted: (_) => _loading ? null : _submit(),
            decoration: _decoration(
              context.tr('confirmNewPassword'),
              _confirmationObscured,
              () => setState(
                () => _confirmationObscured = !_confirmationObscured,
              ),
            ),
          ),
        ]),
      ),
      actions: [
        TextButton(
          onPressed: _loading ? null : () => Navigator.of(context).pop(),
          child: Text(context.tr('cancel')),
        ),
        FilledButton(
          onPressed: _loading ? null : _submit,
          child: _loading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(context.tr('changePassword')),
        ),
      ],
    );
  }
}

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
            Text(
              context.tr('unableLoadSettings'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(userFriendlyError(error), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: onRetry,
              child: Text(context.tr('retry')),
            ),
          ],
        ),
      ),
    );
  }
}
