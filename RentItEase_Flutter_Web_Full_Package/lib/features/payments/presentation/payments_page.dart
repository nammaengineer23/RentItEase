import 'package:flutter/material.dart';

import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/page_container.dart';

class PaymentsPage extends StatelessWidget {
  const PaymentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PageContainer(
      title: 'Payments',
      child: EmptyState(
        title: 'No payment records',
        message: 'Payment history will appear here after the backend payment flow is connected.',
        icon: Icons.payment_outlined,
      ),
    );
  }
}
