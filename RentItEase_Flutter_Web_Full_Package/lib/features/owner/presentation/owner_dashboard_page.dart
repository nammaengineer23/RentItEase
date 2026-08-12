import 'package:flutter/material.dart';

import '../../../shared/widgets/page_container.dart';
import '../../../shared/widgets/stat_card.dart';

class OwnerDashboardPage extends StatelessWidget {
  const OwnerDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageContainer(
      title: 'Owner Dashboard',
      child: LayoutBuilder(
        builder: (_, c) {
          final columns = c.maxWidth >= 900 ? 4 : c.maxWidth >= 600 ? 2 : 1;
          return GridView.count(
            crossAxisCount: columns,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 2.2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: const [
              StatCard(title: 'My properties', value: '0', icon: Icons.home_work),
              StatCard(title: 'Pending visits', value: '0', icon: Icons.event),
              StatCard(title: 'Total views', value: '0', icon: Icons.visibility),
              StatCard(title: 'Active listings', value: '0', icon: Icons.check_circle_outline),
            ],
          );
        },
      ),
    );
  }
}
