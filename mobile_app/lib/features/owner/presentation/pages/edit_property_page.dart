import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/owner_property_model.dart';
import '../../providers/owner_provider.dart';

class EditPropertyPage extends ConsumerStatefulWidget {
  const EditPropertyPage({super.key, required this.property});

  final OwnerPropertyModel property;

  @override
  ConsumerState<EditPropertyPage> createState() => _EditPropertyPageState();
}

class _EditPropertyPageState extends ConsumerState<EditPropertyPage> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController titleController;
  late final TextEditingController descriptionController;
  late final TextEditingController rentController;
  late final TextEditingController addressController;
  late final TextEditingController cityController;
  late final TextEditingController localityController;
  late String propertyType;
  bool loading = false;

  static const propertyTypes = [
    'Apartment',
    'Villa',
    'Independent House',
    'PG',
  ];

  @override
  void initState() {
    super.initState();
    final property = widget.property;

    titleController = TextEditingController(text: property.title);
    descriptionController = TextEditingController(text: property.description);
    rentController = TextEditingController(text: property.rent.toStringAsFixed(0));
    addressController = TextEditingController(text: property.address);
    cityController = TextEditingController(text: property.city);
    localityController = TextEditingController(text: property.locality);
    propertyType = _displayPropertyType(property.propertyType);
  }

  String _displayPropertyType(String value) {
    switch (value.trim().toUpperCase()) {
      case 'APARTMENT':
        return 'Apartment';
      case 'VILLA':
        return 'Villa';
      case 'HOUSE':
      case 'INDEPENDENT HOUSE':
        return 'Independent House';
      case 'PG':
        return 'PG';
      default:
        return 'Apartment';
    }
  }

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    rentController.dispose();
    addressController.dispose();
    cityController.dispose();
    localityController.dispose();
    super.dispose();
  }

  Future<void> _updateProperty() async {
    if (!_formKey.currentState!.validate()) return;

    final rent = double.tryParse(rentController.text.trim());
    if (rent == null || rent <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid monthly rent.')),
      );
      return;
    }

    setState(() => loading = true);

    final source = widget.property;
    final updated = OwnerPropertyModel(
      id: source.id,
      title: titleController.text.trim(),
      description: descriptionController.text.trim(),
      address: addressController.text.trim(),
      city: cityController.text.trim(),
      stateName: source.stateName,
      country: source.country,
      pincode: source.pincode,
      locality: localityController.text.trim(),
      landmark: source.landmark,
      latitude: source.latitude,
      longitude: source.longitude,
      rent: rent,
      securityDeposit: source.securityDeposit,
      bedrooms: source.bedrooms,
      bathrooms: source.bathrooms,
      area: source.area,
      propertyType: propertyType,
      furnishing: source.furnishing,
      parking: source.parking,
      petFriendly: source.petFriendly,
      imageUrl: source.imageUrl,
      isAvailable: source.isAvailable,
      isVerified: source.isVerified,
      totalViews: source.totalViews,
      pendingVisits: source.pendingVisits,
      createdAt: source.createdAt,
      views: source.views,
      favorites: source.favorites,
      visitRequests: source.visitRequests,
    );

    try {
      await ref.read(ownerProvider.notifier).updateProperty(
            updated,
            area: source.area,
            bathrooms: source.bathrooms,
            bedrooms: source.bedrooms,
            country: source.country,
            furnishing: source.furnishing,
            landmark: source.landmark,
            latitude: source.latitude,
            longitude: source.longitude,
            parking: source.parking,
            petFriendly: source.petFriendly,
            pincode: source.pincode,
            securityDeposit: source.securityDeposit,
            stateName: source.stateName,
          );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property updated successfully')),
      );
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to update property: $error')),
      );
    }
  }

  String? _required(String? value) {
    return value == null || value.trim().isEmpty ? 'Required' : null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Property')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: titleController,
              decoration: const InputDecoration(
                labelText: 'Property Title',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: rentController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Monthly Rent',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: propertyType,
              decoration: const InputDecoration(
                labelText: 'Property Type',
                border: OutlineInputBorder(),
              ),
              items: propertyTypes
                  .map((type) => DropdownMenuItem(value: type, child: Text(type)))
                  .toList(),
              onChanged: loading
                  ? null
                  : (value) {
                      if (value != null) {
                        setState(() => propertyType = value);
                      }
                    },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: addressController,
              decoration: const InputDecoration(
                labelText: 'Address',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: localityController,
              decoration: const InputDecoration(
                labelText: 'Locality',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: cityController,
              decoration: const InputDecoration(
                labelText: 'City',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),
            const SizedBox(height: 32),
            SizedBox(
              height: 52,
              child: FilledButton.icon(
                onPressed: loading ? null : _updateProperty,
                icon: loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.save),
                label: Text(loading ? 'Updating...' : 'Update Property'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
