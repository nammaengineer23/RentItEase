import 'package:flutter/material.dart';

class PropertyLocation extends StatelessWidget {
  const PropertyLocation({
    super.key,
    required this.locality,
    required this.city,
    this.latitude,
    this.longitude,
  });

  final String locality;
  final String city;
  final double? latitude;
  final double? longitude;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.only(top: 2),
              child: Icon(
                Icons.location_on_rounded,
                color: Colors.redAccent,
                size: 18,
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: locality,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: colors.onSurface,
                      ),
                    ),
                    TextSpan(
                      text: ', $city',
                      style: TextStyle(
                        fontSize: 14,
                        color: colors.onSurfaceVariant,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),

        if (latitude != null && longitude != null) ...[
          const SizedBox(height: 5),
          Padding(
            padding: const EdgeInsets.only(left: 24),
            child: Text(
              '${latitude!.toStringAsFixed(6)}, '
              '${longitude!.toStringAsFixed(6)}',
              style: TextStyle(
                fontSize: 12,
                color: colors.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
