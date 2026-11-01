import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AddPropertyTypePage extends StatelessWidget {
  const AddPropertyTypePage({super.key});

  static const _options = <_PropertyOption>[
    _PropertyOption('House Rent', 'RENT', 'HOUSE', Icons.home_outlined, 'Add a house for monthly rent.'),
    _PropertyOption('House Lease', 'LEASE', 'HOUSE', Icons.key_outlined, 'Add a house for a long-term lease.'),
    _PropertyOption('House Sale', 'SALE', 'HOUSE', Icons.sell_outlined, 'Add a house for sale.'),
    _PropertyOption('Site Rent', 'SITE_RENT', 'LAND', Icons.landscape_outlined, 'Rent out a plot or site.'),
    _PropertyOption('Site Lease', 'SITE_LEASE', 'LAND', Icons.signpost_outlined, 'Offer a plot or site on lease.'),
    _PropertyOption('Site Sale', 'SITE_SALE', 'LAND', Icons.map_outlined, 'Add a plot or site for sale.'),
  ];

  void _openForm(BuildContext context, _PropertyOption option) {
    if (option.transactionType == 'RENT' && option.propertyType == 'HOUSE') {
      context.push('/owner/add-property-form?transactionType=RENT&propertyType=HOUSE');
      return;
    }
    final query = 'category=${Uri.encodeQueryComponent(option.transactionType)}'
        '&propertyType=${Uri.encodeQueryComponent(option.propertyType)}';
    context.push('/owner/add-marketplace-listing?$query');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose property type')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'What would you like to add?',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Choose a property category to open its matching creation form.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          for (final option in _options) ...[
            Card(
              clipBehavior: Clip.antiAlias,
              child: ListTile(
                leading: CircleAvatar(
                  child: Icon(option.icon),
                ),
                title: Text(option.title),
                subtitle: Text(option.description),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _openForm(context, option),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

class _PropertyOption {
  const _PropertyOption(
    this.title,
    this.transactionType,
    this.propertyType,
    this.icon,
    this.description,
  );

  final String title;
  final String transactionType;
  final String propertyType;
  final IconData icon;
  final String description;
}
