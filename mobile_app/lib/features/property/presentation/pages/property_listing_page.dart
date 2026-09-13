import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/app_error_message.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

import '../../../authentication/providers/authentication_provider.dart';
import '../../providers/property_provider.dart';
import '../widgets/property_card.dart';

class PropertyListingPage extends ConsumerWidget {
  const PropertyListingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertyState = ref.watch(propertyProvider);
    final currentUserId = ref
        .watch(authenticationProvider)
        .authResponse
        ?.user
        .id;

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('properties')), centerTitle: true),
      body: propertyState.when(
        loading: () => const Center(child: CircularProgressIndicator()),

        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 60),
                const SizedBox(height: 20),
                Text(userFriendlyError(error), textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    ref.read(propertyProvider.notifier).loadProperties();
                  },
                  child: Text(context.tr('retry')),
                ),
              ],
            ),
          ),
        ),

        data: (properties) {
          if (properties.isEmpty) {
            return Center(child: Text(context.tr('noPropertiesAvailable')));
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(propertyProvider.notifier).refresh();
            },
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              itemCount: properties.length,
              itemBuilder: (context, index) {
                final property = properties[index];

                return PropertyCard(
                  property: property,

                  onTap: () async {
                    await context.push('/property/${property.id}');
                    await ref
                        .read(propertyProvider.notifier)
                        .refreshProperty(property.id);
                  },

                  onBookVisit: property.ownerId == currentUserId
                      ? null
                      : () {
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

                  onContactOwner: property.ownerId == currentUserId
                      ? null
                      : () => context.push(
                          Uri(
                            path: '/chat',
                            queryParameters: {
                              'propertyId': property.id,
                              'userName': property.ownerName,
                              'propertyTitle': property.title,
                              if (property.imageUrls.isNotEmpty)
                                'propertyImage': property.imageUrls.first,
                            },
                          ).toString(),
                        ),
                );
              },
            ),
          );
        },
      ),
    );
  }

}
