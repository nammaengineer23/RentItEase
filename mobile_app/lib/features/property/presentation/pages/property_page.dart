import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/property_entity.dart';
import '../../providers/property_provider.dart';
import '../widgets/property_card.dart';

class PropertyPage extends ConsumerWidget {
  const PropertyPage({super.key});

  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) {
    final propertyState =
        ref.watch(propertyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Properties'),
        centerTitle: true,
      ),
      body: propertyState.when(
        loading: () {
          return const Center(
            child: CircularProgressIndicator(),
          );
        },
        error: (error, stackTrace) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment:
                    MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 70,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    error.toString(),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () {
                      ref
                          .read(propertyProvider.notifier)
                          .loadProperties();
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        },
        data: (properties) {
          if (properties.isEmpty) {
            return const Center(
              child: Text('No properties found.'),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref
                  .read(propertyProvider.notifier)
                  .refresh();
            },
            child: ListView.builder(
              physics:
                  const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(
                top: 8,
                bottom: 20,
              ),
              itemCount: properties.length,
              itemBuilder: (context, index) {
                final PropertyEntity property =
                    properties[index];

                return PropertyCard(
                  property: property,

                  // ==========================================
                  // Open canonical Property Details route
                  // ==========================================

                  onTap: () {
                    context.push(
                      '/property/${property.id}',
                    );
                  },

                  onBookVisit: () {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(
                      SnackBar(
                        content: Text(
                          'Book visit for ${property.title}',
                        ),
                      ),
                    );
                  },

                  onContactOwner: () {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(
                      SnackBar(
                        content: Text(
                          'Contact ${property.ownerName}',
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}