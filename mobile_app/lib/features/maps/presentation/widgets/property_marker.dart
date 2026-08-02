import 'package:flutter/material.dart';

class PropertyMarker extends StatelessWidget {
  final String price;
  final bool isSelected;
  final VoidCallback? onTap;

  const PropertyMarker({
    super.key,
    required this.price,
    this.isSelected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color primary = Theme.of(context).colorScheme.primary;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? primary : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: primary, width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Text(
              price,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : primary,
              ),
            ),
          ),

          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              color: isSelected ? primary : Colors.white,
              border: Border.all(color: primary, width: 1.5),
              shape: BoxShape.circle,
            ),
          ),

          Container(width: 2, height: 18, color: primary),
        ],
      ),
    );
  }
}
