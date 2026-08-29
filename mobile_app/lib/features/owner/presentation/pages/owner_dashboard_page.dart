import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_localizations.dart';
import '../../providers/owner_provider.dart';
import '../../../authentication/providers/authentication_provider.dart';

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
      appBar: AppBar(
        title: Text(context.tr('ownerDashboard')),
        actions: [
          IconButton(
            tooltip: context.tr('logout'),
            onPressed: () async {
              await ref.read(authenticationProvider).logout();
              if (context.mounted) context.go('/auth');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),

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
                    title: context.tr('properties'),
                    value: '${state.summary?.totalProperties ?? 0}',
                    icon: Icons.home_work,
                    onTap: () => context.push('/owner/properties'),
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: context.tr('activeProperties'),
                    value: '${state.summary?.activeProperties ?? 0}',
                    icon: Icons.verified,
                    onTap: () => context.push('/owner/properties'),
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: context.tr('pendingVisits'),
                    value: '${state.summary?.pendingVisits ?? 0}',
                    icon: Icons.event,
                    onTap: () => context.push('/owner/visit-requests'),
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: context.tr('completedVisits'),
                    value: '${state.summary?.completedVisits ?? 0}',
                    icon: Icons.task_alt,
                    onTap: () => context.push('/owner/visits'),
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: context.tr('propertyViews'),
                    value: '${state.summary?.totalViews ?? 0}',
                    icon: Icons.visibility,
                    onTap: () => context.push('/owner/analytics'),
                  ),

                  const SizedBox(height: 16),

                  DashboardCard(
                    title: context.tr('favorites'),
                    value: '${state.summary?.totalFavorites ?? 0}',
                    icon: Icons.favorite,
                    onTap: () => context.push('/owner/analytics'),
                  ),

                  const SizedBox(height: 30),

                  Text(
                    context.tr('recentActivity'),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 16),

                  if (state.activities.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Center(child: Text(context.tr('noRecentActivity'))),
                      ),
                    ),

                  ...state.activities.map(
                    (activity) => Card(
                      child: ListTile(
                        onTap: () => _openActivity(context, activity.type),
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

  void _openActivity(BuildContext context, String type) {
    final value = type.trim().toUpperCase();
    if (value.contains('VISIT')) {
      context.push('/owner/visit-requests');
    } else if (value.contains('PROPERTY')) {
      context.push('/owner/properties');
    } else {
      context.push('/owner/analytics');
    }
  }
}
