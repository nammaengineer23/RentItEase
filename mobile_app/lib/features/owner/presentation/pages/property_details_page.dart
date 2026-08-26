import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/owner_property_model.dart';
import '../../providers/owner_provider.dart';
import 'edit_property_page.dart';

class OwnerPropertyDetailsPage extends ConsumerWidget {
  const OwnerPropertyDetailsPage({super.key, required this.property});

  final OwnerPropertyModel property;

  Future<void> _edit(BuildContext context) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => EditPropertyPage(property: property),
      ),
    );

    if (changed == true && context.mounted) {
      Navigator.pop(context, true);
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Property'),
        content: const Text('Are you sure you want to delete this property?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(ownerProvider.notifier).deleteProperty(property.id);

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property deleted successfully')),
      );
      Navigator.pop(context, true);
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to delete property: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Property Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _edit(context),
          ),
        ],
      ),
      body: ListView(
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: property.imageUrl.isEmpty
                ? Container(
                    color: Colors.grey.shade300,
                    child: const Icon(Icons.home, size: 80),
                  )
                : Image.network(
                    property.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.grey.shade300,
                      child: const Icon(Icons.home, size: 80),
                    ),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  property.title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '₹${property.rent.toStringAsFixed(0)} / month',
                  style: const TextStyle(
                    fontSize: 22,
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                _InfoTile(
                  icon: Icons.location_on,
                  title: 'Address',
                  value:
                      '${property.address}, ${property.locality}, ${property.city}',
                ),
                _InfoTile(
                  icon: Icons.apartment,
                  title: 'Property Type',
                  value: property.propertyType,
                ),
                _InfoTile(
                  icon: Icons.description,
                  title: 'Description',
                  value: property.description,
                ),
                _InfoTile(
                  icon: Icons.visibility,
                  title: 'Views',
                  value: property.views.toString(),
                ),
                _InfoTile(
                  icon: Icons.favorite,
                  title: 'Favorites',
                  value: property.favorites.toString(),
                ),
                _InfoTile(
                  icon: Icons.calendar_today,
                  title: 'Visit Requests',
                  value: property.visitRequests.toString(),
                ),
                const SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    icon: const Icon(Icons.edit),
                    label: const Text('Edit Property'),
                    onPressed: () => _edit(context),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.delete),
                    label: const Text('Delete Property'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                    ),
                    onPressed: () => _delete(context, ref),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(value),
    );
  }
}
