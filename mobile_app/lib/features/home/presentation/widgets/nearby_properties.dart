import 'package:flutter/material.dart';

import '../../../property/data/models/property_model.dart';
import '../../../property/presentation/widgets/property_card.dart';

class NearbyProperties extends StatelessWidget {
  final List<PropertyModel> properties;
  final ValueChanged<PropertyModel>? onTap;

  const NearbyProperties({
    super.key,
    required this.properties,
    this.onTap,
  });

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
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
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
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Book visit for ${property.title}',
                    ),
                  ),
                );
              },

              onContactOwner: () {
                ScaffoldMessenger.of(context).showSnackBar(
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
      ],
    );
  }
}