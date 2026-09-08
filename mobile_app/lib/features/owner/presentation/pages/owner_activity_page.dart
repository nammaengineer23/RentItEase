import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';

class OwnerActivityPage extends ConsumerStatefulWidget {
  const OwnerActivityPage({super.key});

  @override
  ConsumerState<OwnerActivityPage> createState() => _OwnerActivityPageState();
}

class _OwnerActivityPageState extends ConsumerState<OwnerActivityPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(ownerProvider.notifier).loadDashboard());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Recent Activity')),
      body: RefreshIndicator(
        onRefresh: () => ref.read(ownerProvider.notifier).refreshDashboard(),
        child: state.loading
            ? const Center(child: CircularProgressIndicator())
            : state.activities.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 160),
                  Center(child: Text('No recent activity yet.')),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: state.activities.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final activity = state.activities[index];
                  return ListTile(
                    leading: const Icon(Icons.history),
                    title: Text(activity.title),
                    subtitle: Text(activity.description),
                    trailing: Text(
                      '${activity.createdAt.day}/${activity.createdAt.month}',
                    ),
                  );
                },
              ),
      ),
    );
  }
}
