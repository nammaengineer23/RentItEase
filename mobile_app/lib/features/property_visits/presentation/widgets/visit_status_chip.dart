import 'package:flutter/material.dart';

class VisitStatusChip extends StatelessWidget {
  final String status;

  const VisitStatusChip({super.key, required this.status});

  Color get backgroundColor {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return Colors.green.shade100;

      case 'REJECTED':
        return Colors.red.shade100;

      case 'COMPLETED':
        return Colors.blue.shade100;

      case 'CANCELLED':
        return Colors.grey.shade300;

      case 'PENDING':
      default:
        return Colors.orange.shade100;
    }
  }

  Color get textColor {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return Colors.green.shade800;

      case 'REJECTED':
        return Colors.red.shade800;

      case 'COMPLETED':
        return Colors.blue.shade800;

      case 'CANCELLED':
        return Colors.grey.shade800;

      case 'PENDING':
      default:
        return Colors.orange.shade800;
    }
  }

  IconData get icon {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return Icons.check_circle;

      case 'REJECTED':
        return Icons.cancel;

      case 'COMPLETED':
        return Icons.task_alt;

      case 'CANCELLED':
        return Icons.block;

      case 'PENDING':
      default:
        return Icons.schedule;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 18, color: textColor),
      label: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
      backgroundColor: backgroundColor,
      side: BorderSide.none,
      visualDensity: VisualDensity.compact,
    );
  }
}
