import 'package:flutter/material.dart';

class PropertyFeatures extends StatelessWidget {
  final int bedrooms;
  final int bathrooms;
  final int balconies;
  final double area;
  final int parking;

  const PropertyFeatures({
    super.key,
    required this.bedrooms,
    required this.bathrooms,
    required this.balconies,
    required this.area,
    required this.parking,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _FeatureItem(
          icon: Icons.bed_rounded,
          title: '$bedrooms Bed${bedrooms > 1 ? 's' : ''}',
        ),
        _FeatureItem(
          icon: Icons.bathtub_rounded,
          title: '$bathrooms Bath${bathrooms > 1 ? 's' : ''}',
        ),
        _FeatureItem(
          icon: Icons.balcony_rounded,
          title: '$balconies Balcony${balconies > 1 ? 'ies' : ''}',
        ),
        _FeatureItem(
          icon: Icons.square_foot_rounded,
          title: '${area.toStringAsFixed(0)} sqft',
        ),
        _FeatureItem(
          icon: Icons.local_parking_rounded,
          title: parking > 0
              ? '$parking Parking'
              : 'No Parking',
        ),
      ],
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String title;

  const _FeatureItem({
    required this.icon,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey.shade300,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 18,
            color: Colors.blueGrey,
          ),
          const SizedBox(width: 6),
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}