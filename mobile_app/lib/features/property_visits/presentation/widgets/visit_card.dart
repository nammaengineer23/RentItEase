import 'package:flutter/material.dart';

import '../../domain/entities/property_visit.dart';
import 'visit_status_chip.dart';

class VisitCard extends StatelessWidget {
  final PropertyVisit visit;

  final bool isOwner;

  final VoidCallback? onApprove;

  final VoidCallback? onReject;

  final VoidCallback? onComplete;

  final VoidCallback? onCancel;

  const VisitCard({
    super.key,
    required this.visit,
    this.isOwner = false,
    this.onApprove,
    this.onReject,
    this.onComplete,
    this.onCancel,
  });

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');

    final month = date.month.toString().padLeft(2, '0');

    final year = date.year;

    final hour = date.hour > 12
        ? date.hour - 12
        : (date.hour == 0 ? 12 : date.hour);

    final minute = date.minute.toString().padLeft(2, '0');

    final period = date.hour >= 12 ? 'PM' : 'AM';

    return "$day/$month/$year • $hour:$minute $period";
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      clipBehavior: Clip.antiAlias,
      elevation: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          //=========================================
          // Property Image
          //=========================================
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Image.network(
              visit.propertyImage,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: Colors.grey.shade300,
                child: const Center(child: Icon(Icons.home, size: 60)),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  visit.propertyTitle,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 19,
                  ),
                ),

                const SizedBox(height: 10),

                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 18),

                    const SizedBox(width: 8),

                    Expanded(child: Text(_formatDate(visit.visitDate))),
                  ],
                ),

                const SizedBox(height: 10),

                Row(
                  children: [
                    Icon(isOwner ? Icons.person : Icons.business, size: 18),

                    const SizedBox(width: 8),

                    Expanded(
                      child: Text(isOwner ? visit.tenantName : visit.ownerName),
                    ),
                  ],
                ),

                if (visit.notes != null && visit.notes!.isNotEmpty) ...[
                  const SizedBox(height: 14),

                  Text(
                    visit.notes!,
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                ],

                const SizedBox(height: 16),

                VisitStatusChip(status: visit.status),

                const SizedBox(height: 18),

                //=========================================
                // Owner Buttons
                //=========================================
                if (isOwner && visit.status == "PENDING")
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onApprove,
                          icon: const Icon(Icons.check),
                          label: const Text("Approve"),
                        ),
                      ),

                      const SizedBox(width: 10),

                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onReject,
                          icon: const Icon(Icons.close),
                          label: const Text("Reject"),
                        ),
                      ),
                    ],
                  ),

                if (isOwner && visit.status == "APPROVED") ...[
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: onComplete,
                      icon: const Icon(Icons.task_alt),
                      label: const Text("Mark Completed"),
                    ),
                  ),
                ],

                //=========================================
                // Tenant Button
                //=========================================
                if (!isOwner && visit.status == "PENDING") ...[
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: onCancel,
                      icon: const Icon(Icons.cancel),
                      label: const Text("Cancel Visit"),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
