import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import 'daily_rent_badge.dart';

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
    final colors = Theme.of(context).colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '₹${rent.toStringAsFixed(0)} ${context.tr('perMonth')}',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: colors.onSurface,
                ),
              ),
              if (hasDailyRent) ...[
                const SizedBox(height: 7),
                DailyRentBadge(dailyRent: dailyRent!),
              ],
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isAvailable
                ? colors.primaryContainer
                : colors.errorContainer,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            isAvailable
                ? context.tr('availableNow')
                : context.tr('occupied'),
            style: TextStyle(
              color: isAvailable
                  ? colors.onPrimaryContainer
                  : colors.onErrorContainer,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
