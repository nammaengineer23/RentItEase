import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';
import '../widgets/analytics_chart.dart';
import '../widgets/dashboard_card.dart';

class OwnerAnalyticsPage extends ConsumerStatefulWidget {
  const OwnerAnalyticsPage({super.key});

  @override
  ConsumerState<OwnerAnalyticsPage> createState() => _OwnerAnalyticsPageState();
}

class _OwnerAnalyticsPageState extends ConsumerState<OwnerAnalyticsPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(ownerProvider.notifier).loadAnalytics();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);
    final analytics = state.analytics;

    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: RefreshIndicator(
        onRefresh: () {
          return ref.read(ownerProvider.notifier).refreshAnalytics();
        },
        child: state.loading
            ? ListView(
                children: [
                  const SizedBox(height: 250),
                  const Center(child: CircularProgressIndicator()),
                ],
              )
            : state.error != null
            ? ListView(
                children: [
                  const SizedBox(height: 120),
                  const Icon(Icons.error_outline, size: 70, color: Colors.red),
                  const SizedBox(height: 20),
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Text(state.error!, textAlign: TextAlign.center),
                    ),
                  ),
                ],
              )
            : analytics == null
            ? ListView(
                children: [
                  const SizedBox(height: 120),
                  const Center(child: Text('No analytics data available.')),
                ],
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: DashboardCard(
                          title: 'Views',
                          value: analytics.totalViews.toString(),
                          icon: Icons.visibility,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DashboardCard(
                          title: 'Favorites',
                          value: analytics.totalFavorites.toString(),
                          icon: Icons.favorite,
                          color: Colors.red,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: DashboardCard(
                          title: 'Properties',
                          value: analytics.totalProperties.toString(),
                          icon: Icons.home_work,
                          color: Colors.green,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DashboardCard(
                          title: 'Visits',
                          value: analytics.totalVisits.toString(),
                          icon: Icons.calendar_month,
                          color: Colors.orange,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  const Text(
                    'Property Performance',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 16),

                  AnalyticsChart(analytics: analytics),
                ],
              ),
      ),
    );
  }
}
