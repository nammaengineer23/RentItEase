import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/notifications_provider.dart';
import '../widgets/notification_tile.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() =>
      _NotificationsPageState();
}

class _NotificationsPageState
    extends ConsumerState<NotificationsPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(notificationsProvider.notifier).loadNotifications();
    });
  }

  Future<void> _refresh() async {
    await ref.read(notificationsProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Notifications'),
            if (state.unreadCount > 0) ...[
              const SizedBox(width: 8),
              CircleAvatar(
                radius: 11,
                backgroundColor: Colors.red,
                child: Text(
                  '${state.unreadCount}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (state.notifications.isNotEmpty &&
              state.unreadCount > 0)
            TextButton(
              onPressed: () async {
                await ref
                    .read(notificationsProvider.notifier)
                    .markAllAsRead();

                if (!context.mounted) return;

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'All notifications marked as read',
                    ),
                  ),
                );
              },
              child: const Text('Mark All'),
            ),
        ],
      ),
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : state.error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment:
                          MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 70,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          state.error!,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _refresh,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : state.notifications.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment:
                            MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.notifications_none,
                            size: 80,
                            color: Colors.grey,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'No Notifications',
                            style: TextStyle(
                              fontSize: 18,
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _refresh,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount:
                            state.notifications.length,
                        itemBuilder: (context, index) {
                          return NotificationTile(
                            notification:
                                state.notifications[index],
                          );
                        },
                      ),
                    ),
    );
  }
}