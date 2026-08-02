import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';

import 'my_properties_page.dart';
import 'owner_visits_page.dart';
import 'owner_analytics_page.dart';

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
      final notifier = ref.read(ownerProvider.notifier);

      notifier.loadProperties();

      notifier.loadVisits();

      notifier.loadAnalytics();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Owner Dashboard')),

      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),

              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  const Card(
                    elevation: 3,

                    child: ListTile(
                      leading: CircleAvatar(child: Icon(Icons.person)),

                      title: Text('Welcome Owner 👋'),

                      subtitle: Text('Manage your properties easily'),
                    ),
                  ),

                  const SizedBox(height: 20),

                  GridView.count(
                    shrinkWrap: true,

                    physics: const NeverScrollableScrollPhysics(),

                    crossAxisCount: 2,

                    crossAxisSpacing: 10,

                    mainAxisSpacing: 10,

                    children: [
                      _dashboardCard(
                        icon: Icons.home,

                        title: 'Properties',

                        value: state.properties.length.toString(),
                      ),

                      _dashboardCard(
                        icon: Icons.calendar_month,

                        title: 'Visits',

                        value: state.visits.length.toString(),
                      ),

                      _dashboardCard(
                        icon: Icons.chat,

                        title: 'Chats',

                        value: '0',
                      ),

                      _dashboardCard(
                        icon: Icons.visibility,

                        title: 'Views',

                        value: state.analytics?.totalViews.toString() ?? '0',
                      ),
                    ],
                  ),

                  const SizedBox(height: 25),

                  const Text(
                    'Quick Actions',

                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 10),

                  ListTile(
                    leading: const Icon(Icons.home),

                    title: const Text('My Properties'),

                    trailing: const Icon(Icons.arrow_forward_ios),

                    onTap: () {
                      Navigator.push(
                        context,

                        MaterialPageRoute(
                          builder: (context) => const MyPropertiesPage(),
                        ),
                      );
                    },
                  ),

                  ListTile(
                    leading: const Icon(Icons.calendar_month),

                    title: const Text('Visit Requests'),

                    trailing: const Icon(Icons.arrow_forward_ios),

                    onTap: () {
                      Navigator.push(
                        context,

                        MaterialPageRoute(
                          builder: (context) => const OwnerVisitsPage(),
                        ),
                      );
                    },
                  ),

                  ListTile(
                    leading: const Icon(Icons.analytics),

                    title: const Text('Analytics'),

                    trailing: const Icon(Icons.arrow_forward_ios),

                    onTap: () {
                      Navigator.push(
                        context,

                        MaterialPageRoute(
                          builder: (context) => const OwnerAnalyticsPage(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
    );
  }

  Widget _dashboardCard({
    required IconData icon,

    required String title,

    required String value,
  }) {
    return Card(
      elevation: 2,

      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,

        children: [
          Icon(icon, size: 35),

          const SizedBox(height: 10),

          Text(
            value,

            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),

          Text(title),
        ],
      ),
    );
  }
}
