import 'package:flutter/material.dart';

import 'booking_status_chip.dart';

class BookingCard extends StatelessWidget {
  const BookingCard({
    super.key,
    required this.bookingId,
    required this.propertyTitle,
    required this.location,
    required this.visitDate,
    required this.visitTime,
    required this.ownerName,
    required this.status,
    required this.monthlyRent,
    required this.securityDeposit,
    this.onTap,
    this.onPayNow,
  });

  final String bookingId;
  final String propertyTitle;
  final String location;
  final DateTime visitDate;
  final String visitTime;
  final String ownerName;
  final String status;
  final double monthlyRent;
  final double securityDeposit;
  final VoidCallback? onTap;
  final VoidCallback? onPayNow;

  BookingStatus get bookingStatus {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return BookingStatus.approved;

      case 'REJECTED':
        return BookingStatus.rejected;

      case 'COMPLETED':
      case 'PAID':
        return BookingStatus.completed;

      case 'CANCELLED':
        return BookingStatus.cancelled;

      case 'PENDING':
      case 'PAYMENT_PENDING':
      default:
        return BookingStatus.pending;
    }
  }

  String get formattedDate {
    return '${visitDate.day}/${visitDate.month}/${visitDate.year}';
  }

  bool get isPaymentPending {
    return status.toUpperCase() == 'PAYMENT_PENDING';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      propertyTitle,
                      style: const TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  BookingStatusChip(status: bookingStatus),
                ],
              ),
              const SizedBox(height: 14),
              _InfoRow(icon: Icons.location_on_outlined, text: location),
              const SizedBox(height: 10),
              _InfoRow(icon: Icons.calendar_today, text: formattedDate),
              const SizedBox(height: 10),
              _InfoRow(icon: Icons.access_time, text: visitTime),
              const SizedBox(height: 10),
              _InfoRow(icon: Icons.person_outline, text: ownerName),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 10),
              _AmountRow(label: 'Monthly Rent', amount: monthlyRent),
              const SizedBox(height: 6),
              _AmountRow(label: 'Security Deposit', amount: securityDeposit),
              const SizedBox(height: 6),
              _AmountRow(
                label: 'Total',
                amount: monthlyRent + securityDeposit,
                isTotal: true,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (onTap != null)
                    TextButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.arrow_forward),
                      label: const Text('View Details'),
                    ),
                  if (isPaymentPending && onPayNow != null) ...[
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: onPayNow,
                      icon: const Icon(Icons.payment),
                      label: const Text('Pay Now'),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(text)),
      ],
    );
  }
}

class _AmountRow extends StatelessWidget {
  const _AmountRow({
    required this.label,
    required this.amount,
    this.isTotal = false,
  });

  final String label;
  final double amount;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    final textStyle = Theme.of(context).textTheme.bodyMedium;

    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: isTotal
                ? textStyle?.copyWith(fontWeight: FontWeight.bold)
                : textStyle,
          ),
        ),
        Text(
          '₹${amount.toStringAsFixed(2)}',
          style: textStyle?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
