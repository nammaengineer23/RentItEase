import 'package:flutter/material.dart';

import '../domain/entities/payment_entity.dart';

class PaymentCard extends StatelessWidget {
  const PaymentCard({super.key, required this.payment});

  final PaymentEntity payment;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Details',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            _PaymentRow(
              label: 'Amount',
              value: '₹${payment.amount.toStringAsFixed(2)}',
            ),
            _PaymentRow(label: 'Currency', value: payment.currency),
            _PaymentRow(label: 'Status', value: payment.status),
            if (payment.customerName != null)
              _PaymentRow(label: 'Customer', value: payment.customerName!),
          ],
        ),
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
