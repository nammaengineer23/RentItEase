import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/property_model.dart';

class PropertyNotifier extends StateNotifier<List<PropertyModel>> {
  PropertyNotifier() : super(_dummyProperties());

  static List<PropertyModel> _dummyProperties() {
    return [
      PropertyModel(
        id: '1',
        title: '2 BHK Apartment',
        description:
            'Beautiful semi-furnished apartment located near ITPL, Whitefield.',
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
        description:
            'Affordable fully furnished studio apartment near ORR.',
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
  }

  void addProperty(PropertyModel property) {
    state = [...state, property];
  }

  void removeProperty(String id) {
    state = state.where((e) => e.id != id).toList();
  }

  void updateProperty(PropertyModel property) {
    state = [
      for (final item in state)
        if (item.id == property.id) property else item,
    ];
  }

  List<PropertyModel> featuredProperties() {
    return state.where((e) => e.isFeatured).toList();
  }

  List<PropertyModel> availableProperties() {
    return state.where((e) => e.isAvailable).toList();
  }

  List<PropertyModel> search(String query) {
    final q = query.toLowerCase();

    return state.where((property) {
      return property.title.toLowerCase().contains(q) ||
          property.locality.toLowerCase().contains(q) ||
          property.city.toLowerCase().contains(q);
    }).toList();
  }
}

final propertyProvider =
    StateNotifierProvider<PropertyNotifier, List<PropertyModel>>(
  (ref) => PropertyNotifier(),
);