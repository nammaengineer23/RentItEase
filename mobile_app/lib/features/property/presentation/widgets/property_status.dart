import 'package:flutter/material.dart';

class PropertyStatus extends StatelessWidget {
  final bool isVerified;
  final bool isAvailable;
  final double rating;
  final int views;

  const PropertyStatus({
    super.key,
    required this.isVerified,
    required this.isAvailable,
    required this.rating,
    required this.views,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 10,
      children: [
        if (isVerified)
          _StatusChip(
            icon: Icons.verified,
            label: 'Owner Verified',
            backgroundColor: Colors.green.shade50,
            iconColor: Colors.green,
            textColor: Colors.green.shade700,
          ),

        _StatusChip(
          icon: isAvailable ? Icons.check_circle : Icons.cancel,
          label: isAvailable ? 'Available Now' : 'Occupied',
          backgroundColor: isAvailable
              ? Colors.blue.shade50
              : Colors.red.shade50,
          iconColor: isAvailable ? Colors.blue : Colors.red,
          textColor: isAvailable ? Colors.blue.shade700 : Colors.red.shade700,
        ),

        _StatusChip(
          icon: Icons.star,
          label: rating.toStringAsFixed(1),
          backgroundColor: Colors.amber.shade50,
          iconColor: Colors.amber.shade800,
          textColor: Colors.amber.shade900,
        ),

        _StatusChip(
          icon: Icons.remove_red_eye_outlined,
          label: '$views Views',
          backgroundColor: Colors.grey.shade100,
          iconColor: Colors.grey.shade700,
          textColor: Colors.grey.shade800,
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color iconColor;
  final Color textColor;

  const _StatusChip({
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.iconColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: iconColor),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
