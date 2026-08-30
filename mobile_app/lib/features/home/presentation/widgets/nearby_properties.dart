import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../property/domain/entities/property_entity.dart';
import '../../../property/presentation/widgets/property_card.dart';

class NearbyProperties extends StatelessWidget {
  const NearbyProperties({super.key, required this.properties, this.onTap});

  final List<PropertyEntity> properties;
  final ValueChanged<PropertyEntity>? onTap;

  @override
  Widget build(BuildContext context) {
    if (properties.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Nearby Properties',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
        ),

        const SizedBox(height: 12),

        ListView.builder(
          itemCount: properties.length,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemBuilder: (context, index) {
            final property = properties[index];

            return PropertyCard(
              property: property,

              onTap: () {
                onTap?.call(property);
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
      ],
    );
  }
}
