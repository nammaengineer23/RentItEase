import 'package:flutter/material.dart';

import '../../data/models/analytics_model.dart';

class AnalyticsChart extends StatelessWidget {
  const AnalyticsChart({super.key, required this.analytics});

  final AnalyticsModel analytics;

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        label: 'Views',
        value: analytics.totalViews.toDouble(),
        color: Colors.blue,
      ),
      (
        label: 'Favorites',
        value: analytics.totalFavorites.toDouble(),
        color: Colors.red,
      ),
      (
        label: 'Visits',
        value: analytics.totalVisits.toDouble(),
        color: Colors.orange,
      ),
      (
        label: 'Properties',
        value: analytics.totalProperties.toDouble(),
        color: Colors.green,
      ),
    ];

    final maxValue = items.map((e) => e.value).reduce((a, b) => a > b ? a : b);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: items.map((item) {
            final factor = maxValue == 0 ? 0.0 : item.value / maxValue;

            return Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.label,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      Text(
                        item.value.toInt().toString(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: factor,
                      minHeight: 12,
                      backgroundColor: Colors.grey.shade300,
                      valueColor: AlwaysStoppedAnimation(item.color),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
