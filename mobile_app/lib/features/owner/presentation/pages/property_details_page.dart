import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/owner_property_model.dart';
import '../../providers/owner_provider.dart';

import 'edit_property_page.dart';

class PropertyDetailsPage extends ConsumerWidget {
  final OwnerPropertyModel property;

  const PropertyDetailsPage({super.key, required this.property});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Property Details'),

        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,

                MaterialPageRoute(
                  builder: (context) => EditPropertyPage(property: property),
                ),
              );
            },

            icon: const Icon(Icons.edit),
          ),
        ],
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [
            Container(
              height: 220,

              width: double.infinity,

              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15),

                color: Colors.grey.shade300,
              ),

              child: const Icon(Icons.home, size: 90),
            ),

            const SizedBox(height: 20),

            Text(
              property.title,

              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            _detailRow(Icons.location_on, property.location),

            _detailRow(Icons.home_work, property.propertyType),

            _detailRow(Icons.bed, property.bhk),

            _detailRow(Icons.currency_rupee, '₹${property.rent}/month'),

            _detailRow(Icons.money, 'Deposit ₹${property.deposit}'),

            const SizedBox(height: 20),

            const Text(
              'Description',

              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 8),

            Text(property.description, style: const TextStyle(fontSize: 16)),

            const SizedBox(height: 30),

            SizedBox(
              width: double.infinity,

              child: ElevatedButton.icon(
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,

                    builder: (context) {
                      return AlertDialog(
                        title: const Text('Delete Property'),

                        content: const Text(
                          'Are you sure you want to delete this property?',
                        ),

                        actions: [
                          TextButton(
                            onPressed: () {
                              Navigator.pop(context, false);
                            },

                            child: const Text('Cancel'),
                          ),

                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context, true);
                            },

                            child: const Text('Delete'),
                          ),
                        ],
                      );
                    },
                  );

                  if (confirm == true) {
                    try {
                      await ref
                          .read(ownerProvider.notifier)
                          .deleteProperty(property.id);

                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Property Deleted Successfully'),
                          ),
                        );

                        Navigator.pop(context);
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    }
                  }
                },

                icon: const Icon(Icons.delete),

                label: const Text('Delete Property'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),

      child: Row(
        children: [
          Icon(icon),

          const SizedBox(width: 12),

          Text(text, style: const TextStyle(fontSize: 16)),
        ],
      ),
    );
  }
}
