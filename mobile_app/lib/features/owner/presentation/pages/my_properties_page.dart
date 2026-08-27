import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/owner_provider.dart';
import '../widgets/property_owner_card.dart';

class MyPropertiesPage extends ConsumerStatefulWidget {
  const MyPropertiesPage({super.key});

  @override
  ConsumerState<MyPropertiesPage> createState() => _MyPropertiesPageState();
}

class _MyPropertiesPageState extends ConsumerState<MyPropertiesPage> {
  String _status = 'all';

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(ownerProvider.notifier).loadMyProperties();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);
    final properties = state.properties.where((property) {
      if (_status == 'available') return property.isAvailable;
      if (_status == 'occupied') return !property.isAvailable;
      if (_status == 'visited') return property.visitRequests > 0;
      if (_status == 'completed') {
        return property.visitRequests > 0 && !property.isAvailable;
      }
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('My Properties')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/owner/add-property');
        },
        icon: const Icon(Icons.add),
        label: const Text('Add Property'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(ownerProvider.notifier).refreshProperties(),
        child: state.loading
            ? const Center(child: CircularProgressIndicator())
            : state.error != null
            ? ListView(
                children: [
                  const SizedBox(height: 120),
                  const Icon(Icons.error_outline, size: 70, color: Colors.red),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(state.error!, textAlign: TextAlign.center),
                  ),
                ],
              )
            : state.properties.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 120),
                  Icon(Icons.home_work_outlined, size: 80, color: Colors.grey),
                  SizedBox(height: 20),
                  Center(
                    child: Text(
                      'No properties found',
                      style: TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              )
            : Column(
                children: [
                  SizedBox(
                    height: 58,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      children: [
                        for (final entry in const {
                          'all': 'All',
                          'available': 'Available',
                          'occupied': 'Occupied',
                          'visited': 'Visited',
                          'completed': 'Completed',
                        }.entries)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: ChoiceChip(
                              label: Text(entry.value),
                              selected: _status == entry.key,
                              onSelected: (_) =>
                                  setState(() => _status = entry.key),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: properties.isEmpty
                        ? const Center(
                            child: Text('No properties match this status.'),
                          )
                        : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: properties.length,
                itemBuilder: (context, index) {
                  final property = properties[index];

                  return PropertyOwnerCard(
                    property: property,
                    onTap: () {
                      context.push('/owner/property-details', extra: property);
                    },
                    onEdit: () {
                      context.push('/owner/edit-property', extra: property);
                    },
                    onDelete: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: const Text('Delete Property'),
                          content: const Text(
                            'Are you sure you want to delete this property?',
                          ),
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

                      if (confirm != true) {
                        return;
                      }

                      await ref
                          .read(ownerProvider.notifier)
                          .deleteProperty(property.id);

                      if (!context.mounted) {
                        return;
                      }

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Property deleted successfully'),
                        ),
                      );
                    },
                  );
                },
              ),
                  ),
                ],
              ),
      ),
    );
  }
}
