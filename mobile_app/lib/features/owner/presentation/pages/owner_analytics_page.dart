import 'package:flutter/material.dart';

class OwnerAnalyticsPage extends StatelessWidget {
  const OwnerAnalyticsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final analytics = [
      {
        'title': 'Total Properties',
        'value': '12',
        'icon': Icons.home_work,
      },
      {
        'title': 'Active Listings',
        'value': '8',
        'icon': Icons.check_circle,
      },
      {
        'title': 'Pending Visits',
        'value': '5',
        'icon': Icons.calendar_today,
      },
      {
        'title': 'Total Views',
        'value': '1,248',
        'icon': Icons.visibility,
      },
      {
        'title': 'Favorites',
        'value': '94',
        'icon': Icons.favorite,
      },
      {
        'title': 'Monthly Earnings',
        'value': '₹82,000',
        'icon': Icons.currency_rupee,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Owner Analytics'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: analytics.length,
        itemBuilder: (context, index) {
          final item = analytics[index];

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(
                child: Icon(item['icon'] as IconData),
              ),
              title: Text(item['title'] as String),
              trailing: Text(
                item['value'] as String,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}