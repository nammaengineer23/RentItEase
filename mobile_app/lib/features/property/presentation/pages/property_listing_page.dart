import 'package:flutter/material.dart';

import '../../data/models/property_model.dart';
import '../widgets/property_card.dart';

class PropertyListingPage extends StatelessWidget {
  const PropertyListingPage({super.key});

  @override
  Widget build(BuildContext context) {
    final List<PropertyModel> properties = [
      PropertyModel(
        id: '1',
        title: '2 BHK Apartment',
        description: 'Spacious apartment near ITPL',
        rent: 18000,
        city: 'Bangalore',
        locality: 'Whitefield',
        address: 'Whitefield Main Road',
        bedrooms: 2,
        bathrooms: 2,
        balconies: 2,
        area: 1200,
        propertyType: 'Apartment',
        furnishing: 'Semi Furnished',
        floor: 3,
        totalFloors: 10,
        parking: 1,
        isAvailable: true,
        isFeatured: true,
        isVerified: true,
        rating: 4.8,
        views: 245,
        imageUrls: const [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200',
          'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200',
        ],
        ownerId: 'owner1',
        ownerName: 'Rahul Sharma',
        ownerPhone: '9876543210',
        createdAt: DateTime.now(),
      ),
      PropertyModel(
        id: '2',
        title: '1 BHK Studio',
        description: 'Affordable studio apartment',
        rent: 12000,
        city: 'Bangalore',
        locality: 'Marathahalli',
        address: 'Outer Ring Road',
        bedrooms: 1,
        bathrooms: 1,
        balconies: 1,
        area: 650,
        propertyType: 'Studio',
        furnishing: 'Fully Furnished',
        floor: 2,
        totalFloors: 5,
        parking: 0,
        isAvailable: true,
        isFeatured: false,
        isVerified: true,
        rating: 4.5,
        views: 132,
        imageUrls: const [
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200',
        ],
        ownerId: 'owner2',
        ownerName: 'Priya Verma',
        ownerPhone: '9123456789',
        createdAt: DateTime.now(),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Properties'),
        centerTitle: true,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.only(bottom: 20),
        itemCount: properties.length,
        itemBuilder: (context, index) {
          final property = properties[index];

          return PropertyCard(
            property: property,
            onTap: () {
              // Navigate to Property Details
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
    );
  }
}