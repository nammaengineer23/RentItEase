import 'package:flutter/material.dart';
import '../../../../shared/widgets/primary_button.dart';

class PaymentPage extends StatelessWidget {
  const PaymentPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payments')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Secure Payments',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            const Text(
              'Manage rent payments and deposit transactions in one secure flow.',
            ),
            const Spacer(),
            PrimaryButton(label: 'Pay Now', onPressed: () {}),
          ],
        ),
      ),
    );
  }
}
