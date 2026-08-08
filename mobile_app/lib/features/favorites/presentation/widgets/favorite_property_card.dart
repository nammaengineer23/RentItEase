import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/favorite_property_model.dart';
import '../../providers/favorites_provider.dart';

class FavoritePropertyCard extends ConsumerWidget {
  const FavoritePropertyCard({
    super.key,
    required this.property,
    this.onTap,
    this.onRemove,
  });

  final FavoritePropertyModel property;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;

  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) {
    return Card(
      elevation: 3,
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
      ),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            _buildImage(),

            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  _buildTitleRow(
                    context,
                    ref,
                  ),
                  const SizedBox(height: 10),
                  _buildLocation(),
                  const SizedBox(height: 12),
                  _buildRent(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ======================================================
  // Property Image
  // ======================================================

  Widget _buildImage() {
    final imageUrl = property.imageUrl;

    if (imageUrl == null || imageUrl.isEmpty) {
      return _imagePlaceholder();
    }

    return SizedBox(
      height: 180,
      width: double.infinity,
      child: Image.network(
        imageUrl,
        fit: BoxFit.cover,
        loadingBuilder: (
          context,
          child,
          loadingProgress,
        ) {
          if (loadingProgress == null) {
            return child;
          }

          return const Center(
            child: CircularProgressIndicator(),
          );
        },
        errorBuilder: (
          context,
          error,
          stackTrace,
        ) {
          return _imagePlaceholder();
        },
      ),
    );
  }

  // ======================================================
  // Image Placeholder
  // ======================================================

  Widget _imagePlaceholder() {
    return Container(
      height: 180,
      width: double.infinity,
      color: Colors.grey.shade300,
      child: const Icon(
        Icons.home,
        size: 70,
        color: Colors.grey,
      ),
    );
  }

  // ======================================================
  // Title + Favorite Button
  // ======================================================

  Widget _buildTitleRow(
    BuildContext context,
    WidgetRef ref,
  ) {
    return Row(
      children: [
        Expanded(
          child: Text(
            property.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),

        IconButton(
          tooltip: 'Remove from favorites',
          icon: const Icon(
            Icons.favorite,
            color: Colors.red,
          ),
          onPressed: () async {
            if (onRemove != null) {
              onRemove!();
              return;
            }

            final success = await ref
                .read(favoritesProvider.notifier)
                .removeFavorite(
                  property.propertyId,
                );

            if (!context.mounted) return;

            ScaffoldMessenger.of(context)
                .showSnackBar(
              SnackBar(
                content: Text(
                  success
                      ? 'Removed from favorites'
                      : 'Failed to remove favorite',
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // ======================================================
  // Location
  // ======================================================

  Widget _buildLocation() {
    return Row(
      children: [
        const Icon(
          Icons.location_on,
          size: 18,
          color: Colors.red,
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            property.location.isNotEmpty
                ? property.location
                : property.address,
            style: const TextStyle(
              color: Colors.black87,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // ======================================================
  // Rent
  // ======================================================

  Widget _buildRent() {
    return Text(
      '₹${property.rent.toStringAsFixed(0)} / month',
      style: const TextStyle(
        fontSize: 18,
        color: Colors.blue,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}