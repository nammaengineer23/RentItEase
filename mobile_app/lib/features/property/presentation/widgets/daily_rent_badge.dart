import 'package:flutter/material.dart';

class DailyRentBadge extends StatelessWidget {
  const DailyRentBadge({super.key, required this.dailyRent});

  final double dailyRent;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: colors.tertiaryContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.tertiary.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.calendar_view_day_outlined,
            size: 16,
            color: colors.onTertiaryContainer,
          ),
          const SizedBox(width: 6),
          Text(
            'Daily rental • ₹${dailyRent.toStringAsFixed(0)}/day',
            style: TextStyle(
              color: colors.onTertiaryContainer,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
