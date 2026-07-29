import 'package:flutter/material.dart';

import 'booking_status_chip.dart';

class BookingCard extends StatelessWidget {
  final String propertyTitle;
  final String location;
  final DateTime visitDate;
  final String visitTime;
  final String ownerName;
  final BookingStatus status;
  final VoidCallback? onTap;

  const BookingCard({
    super.key,
    required this.propertyTitle,
    required this.location,
    required this.visitDate,
    required this.visitTime,
    required this.ownerName,
    required this.status,
    this.onTap,
  });

  String get formattedDate {
    return "${visitDate.day}/${visitDate.month}/${visitDate.year}";
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

                  BookingStatusChip(status: status),
                ],
              ),

              const SizedBox(height: 14),

              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(location)),
                ],
              ),

              const SizedBox(height: 10),

              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 18),
                  const SizedBox(width: 8),
                  Text(formattedDate),
                ],
              ),

              const SizedBox(height: 10),

              Row(
                children: [
                  const Icon(Icons.access_time, size: 18),
                  const SizedBox(width: 8),
                  Text(visitTime),
                ],
              ),

              const SizedBox(height: 10),

              Row(
                children: [
                  const Icon(Icons.person_outline, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(ownerName)),
                ],
              ),

              const SizedBox(height: 18),

              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: onTap,
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('View Details'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
