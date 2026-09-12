import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

class PropertyPrice extends StatelessWidget {
  final double rent;
  final bool dailyRentEnabled;
  final double? dailyRent;
  final bool isAvailable;

  const PropertyPrice({
    super.key,
    required this.rent,
    this.dailyRentEnabled = false,
    this.dailyRent,
    required this.isAvailable,
  });

  @override
  Widget build(BuildContext context) {
    final hasDailyRent = dailyRentEnabled && (dailyRent ?? 0) > 0;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '₹${rent.toStringAsFixed(0)} ${context.tr('perMonth')}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              if (hasDailyRent) ...[
                const SizedBox(height: 2),
                Text(
                  '₹${dailyRent!.toStringAsFixed(0)} / day',
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(width: 8),
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
