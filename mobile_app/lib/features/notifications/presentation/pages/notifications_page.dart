import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/notifications_provider.dart';
import '../widgets/notification_tile.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(notificationsProvider.notifier).loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),

        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),

            child: Center(
              child: Text(
                state.unreadCount > 0 ? '${state.unreadCount}' : '',

                style: const TextStyle(
                  fontWeight: FontWeight.bold,

                  fontSize: 18,
                ),
              ),
            ),
          ),
        ],
      ),

      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.notifications.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,

                children: [
                  Icon(Icons.notifications_none, size: 80, color: Colors.grey),

                  SizedBox(height: 15),

                  Text('No Notifications', style: TextStyle(fontSize: 18)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () async {
                await ref
                    .read(notificationsProvider.notifier)
                    .loadNotifications();
              },

              child: ListView.builder(
                padding: const EdgeInsets.all(16),

                itemCount: state.notifications.length,

                itemBuilder: (context, index) {
                  final notification = state.notifications[index];

                  return NotificationTile(notification: notification);
                },
              ),
            ),
    );
  }
}
