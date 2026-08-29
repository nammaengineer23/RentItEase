import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../domain/entities/visit_request_entity.dart';

class VisitRequestCard extends StatelessWidget {
  const VisitRequestCard({
    super.key,
    required this.visit,
    this.onApprove,
    this.onReject,
    this.onComplete,
  });

  final VisitRequestEntity visit;

  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final VoidCallback? onComplete;

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return Colors.green;
      case 'REJECTED':
        return Colors.red;
      case 'COMPLETED':
        return Colors.blue;
      case 'CANCELLED':
        return Colors.grey;
      default:
        return Colors.orange;
    }
  }

  String _formatDate(DateTime date) {
    return "${date.day.toString().padLeft(2, '0')}/"
        "${date.month.toString().padLeft(2, '0')}/"
        "${date.year} "
        "${date.hour.toString().padLeft(2, '0')}:"
        "${date.minute.toString().padLeft(2, '0')}";
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(visit.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              visit.propertyTitle,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),

            const SizedBox(height: 12),

            Row(
              children: [
                const Icon(Icons.person, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(visit.tenantName)),
              ],
            ),

            const SizedBox(height: 8),

            Row(
              children: [
                const Icon(Icons.phone, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(visit.tenantPhone)),
              ],
            ),

            const SizedBox(height: 8),

            Row(
              children: [
                const Icon(Icons.calendar_month, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(_formatDate(visit.visitDate))),
              ],
            ),

            if (visit.notes != null && visit.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(visit.notes!, style: TextStyle(color: Colors.grey.shade700)),
            ],

            const SizedBox(height: 16),

            Chip(
              label: Text(
                visit.status,
                style: const TextStyle(color: Colors.white),
              ),
              backgroundColor: statusColor,
            ),

            const SizedBox(height: 18),

            if (visit.status == 'PENDING')
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: onApprove,
                      icon: const Icon(Icons.check),
                      label: Text(context.tr('approve')),
                    ),
                  ),

                  const SizedBox(width: 12),

                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onReject,
                      icon: const Icon(Icons.close),
                      label: Text(context.tr('reject')),
                    ),
                  ),
                ],
              ),

            if (visit.status == 'APPROVED')
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onComplete,
                  icon: const Icon(Icons.task_alt),
                  label: Text(context.tr('markCompleted')),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
