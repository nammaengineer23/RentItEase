import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

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
            icon: const Icon(Icons.chat_bubble_outline),
            label: Text(context.tr('chat')),
          ),
        ),

        const SizedBox(width: 12),

        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            onPressed: onBookVisit,
            icon: const Icon(Icons.calendar_today),
            label: Text(context.tr('bookVisit')),
          ),
        ),
      ],
    );
  }
}
