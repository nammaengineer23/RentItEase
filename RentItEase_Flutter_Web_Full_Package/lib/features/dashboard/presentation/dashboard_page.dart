import 'package:flutter/material.dart';

import '../../../shared/widgets/page_container.dart';
import '../../../shared/widgets/stat_card.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageContainer(
      title: 'Dashboard',
      child: LayoutBuilder(
        builder: (context, c) {
          final columns = c.maxWidth >= 900 ? 4 : c.maxWidth >= 600 ? 2 : 1;
          return GridView.count(
            crossAxisCount: columns,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 2.2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: const [
              StatCard(title: 'Saved properties', value: '0', icon: Icons.favorite),
              StatCard(title: 'Upcoming visits', value: '0', icon: Icons.event),
              StatCard(title: 'Active rentals', value: '0', icon: Icons.home),
              StatCard(title: 'Messages', value: '0', icon: Icons.chat_bubble_outline),
            ],
          );
        },
      ),
    );
  }
}
