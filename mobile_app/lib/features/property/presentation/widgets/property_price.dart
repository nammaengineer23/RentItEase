import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

class PropertyPrice extends StatelessWidget {
  final double rent;
  final bool isAvailable;

  const PropertyPrice({
    super.key,
    required this.rent,
    required this.isAvailable,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '₹${rent.toStringAsFixed(0)}',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          context.tr('perMonth'),
          style: const TextStyle(color: Colors.grey, fontSize: 15),
        ),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isAvailable ? Colors.green.shade50 : Colors.red.shade50,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            isAvailable
                ? context.tr('availableNow')
                : context.tr('occupied'),
            style: TextStyle(
              color: isAvailable ? Colors.green.shade700 : Colors.red.shade700,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
