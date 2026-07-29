import 'package:flutter/material.dart';
import '../../../../shared/widgets/secondary_button.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Preferences',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            const Text(
              'Customize notifications, privacy, and account security.',
            ),
            const Spacer(),
            SecondaryButton(label: 'Save Preferences', onPressed: () {}),
          ],
        ),
      ),
    );
  }
}
