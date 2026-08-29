import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
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
      appBar: AppBar(title: Text(context.tr('analytics'))),
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
                  Center(child: Text(context.tr('noAnalyticsData'))),
                ],
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: DashboardCard(
                          title: context.tr('views'),
                          value: analytics.totalViews.toString(),
                          icon: Icons.visibility,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DashboardCard(
                          title: context.tr('favorites'),
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
                          title: context.tr('properties'),
                          value: analytics.totalProperties.toString(),
                          icon: Icons.home_work,
                          color: Colors.green,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DashboardCard(
                          title: context.tr('visits'),
                          value: analytics.totalVisits.toString(),
                          icon: Icons.calendar_month,
                          color: Colors.orange,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  Text(
                    context.tr('propertyPerformance'),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 16),

                  AnalyticsChart(analytics: analytics),
                ],
              ),
      ),
    );
  }
}
