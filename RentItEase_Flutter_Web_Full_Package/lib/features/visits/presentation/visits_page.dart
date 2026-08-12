import 'package:flutter/material.dart';

import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/page_container.dart';

class VisitsPage extends StatelessWidget {
  const VisitsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PageContainer(
      title: 'Property visits',
      child: EmptyState(
        title: 'No visits scheduled',
        message: 'Your requested and upcoming property visits will appear here.',
        icon: Icons.event_available,
      ),
    );
  }
}
