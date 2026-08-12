class SettingsEntity {
  const SettingsEntity({
    required this.pushNotifications,
    required this.emailNotifications,
    required this.smsNotifications,
    required this.darkMode,
    required this.language,
  });

  final bool pushNotifications;
  final bool emailNotifications;
  final bool smsNotifications;
  final bool darkMode;
  final String language;
}
