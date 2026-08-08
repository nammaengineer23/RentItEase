import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';

import '../widgets/dashboard_card.dart';

class OwnerDashboardPage extends ConsumerStatefulWidget {
  const OwnerDashboardPage({super.key});

  @override
  ConsumerState<OwnerDashboardPage> createState() => _OwnerDashboardPageState();
}

class _OwnerDashboardPageState extends ConsumerState<OwnerDashboardPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(ownerProvider.notifier).loadDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Owner Dashboard')),

      body: RefreshIndicator(
        onRefresh: () => ref.read(ownerProvider.notifier).refreshDashboard(),

        child: state.loading
            ? const Center(child: CircularProgressIndicator())
            : state.error != null
            ? ListView(
                children: [
                  const SizedBox(height: 120),

                  const Icon(Icons.error_outline, color: Colors.red, size: 70),

                  const SizedBox(height: 20),

                  Center(
                    child: Text(state.error!, textAlign: TextAlign.center),
                  ),
                ],
              )
            : ListView(
                padding: const EdgeInsets.all(16),

                children: [
                  DashboardCard(
                    title: 'Properties',
                    value: '${state.summary?.totalProperties ?? 0}',
                    icon: Icons.home_work,
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: 'Active Properties',
                    value: '${state.summary?.activeProperties ?? 0}',
                    icon: Icons.verified,
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: 'Pending Visits',
                    value: '${state.summary?.pendingVisits ?? 0}',
                    icon: Icons.event,
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: 'Completed Visits',
                    value: '${state.summary?.completedVisits ?? 0}',
                    icon: Icons.task_alt,
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: 'Property Views',
                    value: '${state.summary?.totalViews ?? 0}',
                    icon: Icons.visibility,
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: 'Favorites',
                    value: '${state.summary?.totalFavorites ?? 0}',
                    icon: Icons.favorite,
                  ),

                  const SizedBox(height: 30),

                  const Text(
                    'Recent Activity',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 16),

                  if (state.activities.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: Center(child: Text('No recent activity')),
                      ),
                    ),

                  ...state.activities.map(
                    (activity) => Card(
                      child: ListTile(
                        leading: const CircleAvatar(child: Icon(Icons.history)),
                        title: Text(activity.title),
                        subtitle: Text(activity.description),
                        trailing: Text(
                          activity.type,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
