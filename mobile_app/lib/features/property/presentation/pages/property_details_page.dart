import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/property_entity.dart';
import '../../providers/property_provider.dart';

import '../../../favorites/providers/favorites_provider.dart';
import '../../../maps/presentation/widgets/property_map.dart';
import '../../../property_visits/presentation/pages/book_visit_page.dart';
import '../widgets/property_action_buttons.dart';
import '../widgets/property_features.dart';
import '../widgets/property_image_slider.dart';
import '../widgets/property_location.dart';
import '../widgets/property_price.dart';
import '../widgets/property_status.dart';

class PropertyDetailsPage extends ConsumerStatefulWidget {
  final String propertyId;

  const PropertyDetailsPage({
    super.key,
    required this.propertyId,
  });

  @override
  ConsumerState<PropertyDetailsPage> createState() =>
      _PropertyDetailsPageState();
}

class _PropertyDetailsPageState
    extends ConsumerState<PropertyDetailsPage> {
  PropertyEntity? property;
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadProperty();
  }

  Future<void> _loadProperty() async {
    try {
      final repository = ref.read(propertyRepositoryProvider);
      final result = await repository.getProperty(widget.propertyId);

      if (!mounted) return;

      setState(() {
        property = result;
        isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Text(error!),
        ),
      );
    }

    final property = this.property!;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: Colors.white,
            elevation: 0,
            leading: CircleAvatar(
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(
                  Icons.arrow_back,
                  color: Colors.black,
                ),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            actions: [
              CircleAvatar(
                backgroundColor: Colors.white,
                child: IconButton(
                  icon: const Icon(
                    Icons.favorite_border,
                    color: Colors.red,
                  ),
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);

                    await ref
                        .read(favoritesProvider.notifier)
                        .addFavorite(property.id);

                    if (!mounted) return;

                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('Added to Favorites ❤️'),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 10),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: PropertyImageSlider(
                property: property,
              ),
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
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    property.description,
                    style: const TextStyle(
                      color: Colors.grey,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'Owner Details',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
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
                        child: Text(
                          property.ownerName.isEmpty
                              ? '?'
                              : property.ownerName[0].toUpperCase(),
                        ),
                      ),
                      title: Text(property.ownerName),
                      subtitle: Text(property.ownerPhone),
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'Location',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 15),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: const SizedBox(
                      height: 300,
                      child: PropertyMap(),
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
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BookVisitPage(
                    propertyId: property.id,
                    propertyTitle: property.title,
                    propertyImage: property.imageUrls.isNotEmpty ? property.imageUrls.first: '',  
                    ownerName: property.ownerName,
                  ),
                ),
              );
            },
            onContactOwner: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Calling ${property.ownerName}',
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}