import 'package:flutter/material.dart';

class PropertyActionButtons extends StatelessWidget {
  const PropertyActionButtons({
    super.key,
    this.onBookVisit,
    this.onContactOwner,
  });

  final VoidCallback? onBookVisit;
  final VoidCallback? onContactOwner;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: onContactOwner,
            icon: const Icon(Icons.call_outlined),
            label: const Text('Contact'),
          ),
        ),

        const SizedBox(width: 12),

        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            onPressed: onBookVisit,
            icon: const Icon(Icons.calendar_today),
            label: const Text('Book Visit'),
          ),
        ),
      ],
    );
  }
}