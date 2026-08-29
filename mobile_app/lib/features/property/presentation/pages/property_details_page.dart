import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_localizations.dart';
import '../../domain/entities/property_entity.dart';
import '../../providers/property_provider.dart';

import '../../../favorites/providers/favorites_provider.dart';
import '../../../authentication/providers/authentication_provider.dart';
import '../../../../core/network/dio_provider.dart';
import '../../../maps/presentation/widgets/property_map.dart';
import '../../../property_visits/presentation/pages/book_visit_page.dart';
import '../widgets/property_action_buttons.dart';
import '../widgets/property_features.dart';
import '../widgets/property_image_slider.dart';
import '../widgets/property_location.dart';
import '../widgets/property_price.dart';
import '../widgets/property_status.dart';

class PropertyDetailsPage extends ConsumerStatefulWidget {
  const PropertyDetailsPage({super.key, required this.propertyId});

  final String propertyId;

  @override
  ConsumerState<PropertyDetailsPage> createState() =>
      _PropertyDetailsPageState();
}

class _PropertyDetailsPageState extends ConsumerState<PropertyDetailsPage> {
  PropertyEntity? property;

  bool isLoading = true;
  bool isFavorite = false;
  bool isFavoriteLoading = true;
  bool hasPremiumMembership = false;
  String ownerName = '';
  String ownerPhone = '';

  String? error;

  @override
  void initState() {
    super.initState();

    _loadProperty();
    _checkFavorite();
    _loadOwnerContact();
  }

  Future<void> _loadOwnerContact() async {
    try {
      final response = await ref
          .read(dioProvider)
          .get('/properties/${widget.propertyId}/contact');
      dynamic value = response.data;
      while (value is Map && value.containsKey('data')) {
        value = value['data'];
      }
      if (!mounted) return;
      if (value is Map) {
        setState(() {
          hasPremiumMembership = true;
          ownerName = value['fullName']?.toString() ?? '';
          ownerPhone = value['phone']?.toString() ?? '';
        });
      }
    } catch (_) {
      // A 403 response is represented as a locked contact card.
    }
  }

  // ============================================================
  // Load Property
  // ============================================================

  Future<void> _loadProperty() async {
    try {
      final repository = ref.read(propertyRepositoryProvider);

      final result = await repository.getProperty(widget.propertyId);

      final role = ref
          .read(authenticationProvider)
          .authResponse
          ?.user
          .role
          .trim()
          .toUpperCase();
      if (role == 'USER' || role == 'TENANT') {
        try {
          await ref.read(dioProvider).post('/properties/${widget.propertyId}/view');
        } catch (_) {
          // A view-count failure must not prevent opening property details.
        }
      }

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

  // ============================================================
  // Check Favorite
  // ============================================================

  Future<void> _checkFavorite() async {
    try {
      final favorite = await ref
          .read(favoritesProvider.notifier)
          .checkFavorite(widget.propertyId);

      if (!mounted) return;

      setState(() {
        isFavorite = favorite;
        isFavoriteLoading = false;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        isFavorite = false;
        isFavoriteLoading = false;
      });
    }
  }

  // ============================================================
  // Toggle Favorite
  // ============================================================

  Future<void> _toggleFavorite() async {
    if (isFavoriteLoading) return;

    setState(() {
      isFavoriteLoading = true;
    });

    final notifier = ref.read(favoritesProvider.notifier);

    bool success;

    if (isFavorite) {
      success = await notifier.removeFavorite(widget.propertyId);
    } else {
      success = await notifier.addFavorite(widget.propertyId);
    }

    if (!mounted) return;

    if (success) {
      setState(() {
        isFavorite = !isFavorite;
        isFavoriteLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isFavorite
                ? context.tr('addedFavorite')
                : context.tr('removedFavorite'),
          ),
        ),
      );
    } else {
      setState(() {
        isFavoriteLoading = false;
      });

      final providerError = ref.read(favoritesProvider).error;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(providerError ?? context.tr('favoriteUpdateFailed')),
        ),
      );
    }
  }

  // ============================================================
  // Build
  // ============================================================

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(error!, textAlign: TextAlign.center),
          ),
        ),
      );
    }

    final property = this.property;

    if (property == null) {
      return Scaffold(
        body: Center(child: Text(context.tr('propertyNotFound'))),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ======================================================
          // Property Header
          // ======================================================
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: Colors.white,
            elevation: 0,

            leading: CircleAvatar(
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () {
                  Navigator.pop(context);
                },
              ),
            ),

            actions: [
              CircleAvatar(
                backgroundColor: Colors.white,
                child: IconButton(
                  tooltip: isFavorite
                      ? context.tr('removeFromFavorites')
                      : context.tr('addToFavorites'),
                  onPressed: isFavoriteLoading ? null : _toggleFavorite,
                  icon: isFavoriteLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(
                          isFavorite ? Icons.favorite : Icons.favorite_border,
                          color: Colors.red,
                        ),
                ),
              ),
              const SizedBox(width: 10),
            ],

            flexibleSpace: FlexibleSpaceBar(
              background: PropertyImageSlider(property: property),
            ),
          ),

          // ======================================================
          // Property Content
          // ======================================================
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
                    latitude: property.latitude,
                    longitude: property.longitude,
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
                    totalReviews: property.totalReviews,
                    views: property.views,
                    onReviewsTap: () =>
                        context.push('/reviews/${property.id}'),
                  ),

                  const SizedBox(height: 28),

                  Text(
                    context.tr('description'),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 10),

                  Text(
                    property.description,
                    style: const TextStyle(color: Colors.grey, height: 1.6),
                  ),

                  const SizedBox(height: 30),

                  Text(
                    context.tr('ownerDetails'),
                    style: const TextStyle(
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
                    child: hasPremiumMembership
                        ? ListTile(
                            leading: CircleAvatar(
                              child: Text(
                                ownerName.isEmpty
                                    ? 'O'
                                    : ownerName[0].toUpperCase(),
                              ),
                            ),
                            title: Text(ownerName),
                            subtitle: Text(ownerPhone),
                          )
                        : ListTile(
                            leading: const CircleAvatar(
                              child: Icon(Icons.workspace_premium_outlined),
                            ),
                            title: Text(context.tr('ownerContactProtected')),
                            subtitle: Text(context.tr('premiumOwnerContact')),
                            trailing: const Icon(Icons.lock_outline),
                            onTap: () => context.push('/profile'),
                          ),
                  ),

                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => context.push(
                        '/chat',
                        extra: {'propertyId': property.id},
                      ),
                      icon: const Icon(Icons.chat_bubble_outline),
                      label: Text(context.tr('chatWithOwner')),
                    ),
                  ),

                  const SizedBox(height: 30),

                  Text(
                    context.tr('location'),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 15),

                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: SizedBox(
                      height: 300,
                      child: PropertyMap(
                        latitude: property.latitude,
                        longitude: property.longitude,
                      ),
                    ),
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // ==========================================================
      // Bottom Actions
      // ==========================================================
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
                    propertyImage: property.imageUrls.isNotEmpty
                        ? property.imageUrls.first
                        : '',
                    ownerName: property.ownerName,
                  ),
                ),
              );
            },
            onContactOwner: () {
              context.push(
                '/chat',
                extra: {'propertyId': property.id},
              );
            },
          ),
        ),
      ),
    );
  }
}
