import 'package:flutter/material.dart';

import '../../domain/entities/property_entity.dart';

import 'property_action_buttons.dart';
import 'property_features.dart';
import 'property_image_slider.dart';
import 'property_location.dart';
import 'property_price.dart';
import 'property_status.dart';

class PropertyCard extends StatelessWidget {
  const PropertyCard({
    super.key,
    required this.property,
    this.onTap,
    this.onBookVisit,
    this.onContactOwner,
  });

  final PropertyEntity property;

  final VoidCallback? onTap;

  final VoidCallback? onBookVisit;

  final VoidCallback? onContactOwner;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      elevation: 4,
      shadowColor: Colors.black12,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// Images
            PropertyImageSlider(property: property),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  /// Price
                  PropertyPrice(
                    rent: property.rent,
                    isAvailable: property.isAvailable,
                  ),

                  const SizedBox(height: 10),

                  /// Title
                  Text(
                    property.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 8),

                  /// Location
                  PropertyLocation(
                    locality: property.locality,
                    city: property.city,
                  ),

                  const SizedBox(height: 14),

                  /// Features
                  PropertyFeatures(
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    balconies: property.balconies,
                    area: property.area,
                    parking: property.parking,
                  ),

                  const SizedBox(height: 14),

                  /// Status
                  PropertyStatus(
                    isVerified: property.isVerified,
                    isAvailable: property.isAvailable,
                    rating: property.rating,
                    views: property.views,
                  ),

                  const SizedBox(height: 18),

                  /// Action Buttons
                  PropertyActionButtons(
                    onBookVisit: onBookVisit,
                    onContactOwner: onContactOwner,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
