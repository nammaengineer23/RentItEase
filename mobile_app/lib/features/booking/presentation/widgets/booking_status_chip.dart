import 'package:flutter/material.dart';

enum BookingStatus {
  pending,
  approved,
  rejected,
  completed,
  cancelled,
}

class BookingStatusChip extends StatelessWidget {
  final BookingStatus status;

  const BookingStatusChip({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor;
    IconData icon;
    String label;

    switch (status) {
      case BookingStatus.pending:
        backgroundColor = Colors.orange.shade50;
        textColor = Colors.orange.shade800;
        icon = Icons.schedule;
        label = 'Pending';
        break;

      case BookingStatus.approved:
        backgroundColor = Colors.green.shade50;
        textColor = Colors.green.shade800;
        icon = Icons.check_circle;
        label = 'Approved';
        break;

      case BookingStatus.rejected:
        backgroundColor = Colors.red.shade50;
        textColor = Colors.red.shade800;
        icon = Icons.cancel;
        label = 'Rejected';
        break;

      case BookingStatus.completed:
        backgroundColor = Colors.blue.shade50;
        textColor = Colors.blue.shade800;
        icon = Icons.task_alt;
        label = 'Completed';
        break;

      case BookingStatus.cancelled:
        backgroundColor = Colors.grey.shade200;
        textColor = Colors.grey.shade800;
        icon = Icons.block;
        label = 'Cancelled';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: textColor,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}