import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/property_entity.dart';

import '../../../favorites/providers/favorites_provider.dart';
import '../../../maps/presentation/widgets/property_map.dart';

import '../widgets/property_action_buttons.dart';
import '../widgets/property_features.dart';
import '../widgets/property_image_slider.dart';
import '../widgets/property_location.dart';
import '../widgets/property_price.dart';
import '../widgets/property_status.dart';

class PropertyDetailsPage extends ConsumerWidget {
  final PropertyEntity property;

  const PropertyDetailsPage({super.key, required this.property});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            elevation: 0,
            backgroundColor: Colors.white,
            leading: CircleAvatar(
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            actions: [
              CircleAvatar(
                backgroundColor: Colors.white,
                child: IconButton(
                  icon: const Icon(Icons.favorite_border, color: Colors.red),
                  onPressed: () async {
                    await ref
                        .read(favoritesProvider.notifier)
                        .addFavorite(property.id);

                    if (!context.mounted) return;

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Added to Favorites ❤️')),
                    );
                  },
                ),
              ),
              const SizedBox(width: 10),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: PropertyImageSlider(property: property),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  PropertyPrice(
                    rent: property.rent,
                    isAvailable: property.isAvailable,
                  ),

                  const SizedBox(height: 14),

                  Text(
                    property.title,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 10),

                  PropertyLocation(
                    locality: property.locality,
                    city: property.city,
                  ),

                  const SizedBox(height: 20),

                  PropertyFeatures(
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    balconies: property.balconies,
                    area: property.area,
                    parking: property.parking,
                  ),

                  const SizedBox(height: 20),

                  PropertyStatus(
                    isVerified: property.isVerified,
                    isAvailable: property.isAvailable,
                    rating: property.rating,
                    views: property.views,
                  ),

                  const SizedBox(height: 28),

                  const Text(
                    'Description',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 10),

                  Text(
                    property.description,
                    style: TextStyle(color: Colors.grey, height: 1.6),
                  ),

                  const SizedBox(height: 30),

                  const Text(
                    'Owner Details',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 14),

                  Card(
                    elevation: 0,
                    color: Colors.grey.shade100,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        child: Text(
                          property.ownerName.isEmpty
                              ? '?'
                              : property.ownerName[0].toUpperCase(),
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      title: Text(
                        property.ownerName,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(property.ownerPhone),
                    ),
                  ),

                  const SizedBox(height: 30),

                  const Text(
                    'Location',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 12),

                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: const SizedBox(height: 320, child: PropertyMap()),
                  ),

                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // TODO:
                        // Launch Google Maps after Maps integration.
                      },
                      icon: const Icon(Icons.navigation),
                      label: const Text('Open in Google Maps'),
                    ),
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: PropertyActionButtons(
            onBookVisit: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Visit booking integration coming next.'),
                ),
              );
            },
            onContactOwner: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Calling ${property.ownerName}')),
              );
            },
          ),
        ),
      ),
    );
  }
}
