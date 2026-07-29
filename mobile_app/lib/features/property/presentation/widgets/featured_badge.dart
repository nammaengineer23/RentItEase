import 'package:flutter/material.dart';

class FeaturedBadge extends StatelessWidget {
  final bool isFeatured;

  const FeaturedBadge({super.key, required this.isFeatured});

  @override
  Widget build(BuildContext context) {
    if (!isFeatured) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFA000), Color(0xFFFF6F00)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.workspace_premium, color: Colors.white, size: 14),
          SizedBox(width: 4),
          Text(
            'FEATURED',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
