import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/property_entity.dart';
import '../../providers/property_provider.dart';
import '../widgets/property_card.dart';

class PropertyPage extends ConsumerWidget {
  const PropertyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertyState = ref.watch(propertyProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('properties')), centerTitle: true),
      body: propertyState.when(
        loading: () {
          return const Center(child: CircularProgressIndicator());
        },
        error: (error, stackTrace) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 70),
                  const SizedBox(height: 20),
                  Text(error.toString(), textAlign: TextAlign.center),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () {
                      ref.read(propertyProvider.notifier).loadProperties();
                    },
                    icon: const Icon(Icons.refresh),
                    label: Text(context.tr('retry')),
                  ),
                ],
              ),
            ),
          );
        },
        data: (properties) {
          if (properties.isEmpty) {
            return Center(child: Text(context.tr('noPropertiesFound')));
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(propertyProvider.notifier).refresh();
            },
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(top: 8, bottom: 20),
              itemCount: properties.length,
              itemBuilder: (context, index) {
                final PropertyEntity property = properties[index];

                return PropertyCard(
                  property: property,

                  // ==========================================
                  // Open canonical Property Details route
                  // ==========================================
                  onTap: () {
                    context.push('/property/${property.id}');
                  },

                  onBookVisit: () {
                    context.push(
                      '/book-visit/${property.id}',
                      extra: {
                        'propertyTitle': property.title,
                        'propertyImage': property.imageUrls.isNotEmpty
                            ? property.imageUrls.first
                            : '',
                        'ownerName': property.ownerName,
                      },
                    );
                  },

                  onContactOwner: () {
                    context.push(
                      '/chat?propertyId=${Uri.encodeComponent(property.id)}',
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
