import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/storage/session_storage.dart';
import '../../../shared/widgets/page_container.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  Future<void> logout(BuildContext context) async {
    await SessionStorage().clear();
    if (context.mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return PageContainer(
      title: 'Profile',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CircleAvatar(radius: 36, child: Icon(Icons.person, size: 36)),
              const SizedBox(height: 20),
              Text('My account', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              const Text('Connect this page to the /auth/me endpoint for live profile data.'),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => logout(context),
                icon: const Icon(Icons.logout),
                label: const Text('Sign out'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
