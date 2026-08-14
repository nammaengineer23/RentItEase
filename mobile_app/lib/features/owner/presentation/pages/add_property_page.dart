import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/owner_property_entity.dart';
import '../../providers/owner_provider.dart';

class AddPropertyPage extends ConsumerStatefulWidget {
  const AddPropertyPage({super.key});

  @override
  ConsumerState<AddPropertyPage> createState() => _AddPropertyPageState();
}

class _AddPropertyPageState extends ConsumerState<AddPropertyPage> {
  final _formKey = GlobalKey<FormState>();

  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  final rentController = TextEditingController();
  final securityDepositController = TextEditingController();
  final addressController = TextEditingController();
  final localityController = TextEditingController();
  final landmarkController = TextEditingController();
  final cityController = TextEditingController();
  final stateController = TextEditingController();
  final countryController = TextEditingController(text: 'India');
  final pincodeController = TextEditingController();
  final bedroomsController = TextEditingController(text: '2');
  final bathroomsController = TextEditingController(text: '2');
  final areaController = TextEditingController(text: '1000');

  String propertyType = 'Apartment';
  String furnishing = 'Semi Furnished';

  bool parking = false;
  bool petFriendly = false;
  bool loading = false;

  Future<void> _saveProperty() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final rent = double.tryParse(rentController.text.trim());

    final securityDeposit = double.tryParse(
      securityDepositController.text.trim(),
    );

    final bedrooms = int.tryParse(bedroomsController.text.trim());

    final bathrooms = int.tryParse(bathroomsController.text.trim());

    final area = double.tryParse(areaController.text.trim());

    if (rent == null ||
        securityDeposit == null ||
        bedrooms == null ||
        bathrooms == null ||
        area == null) {
      _showError('Please enter valid numeric property details.');
      return;
    }

    setState(() {
      loading = true;
    });

    try {
      final property = OwnerPropertyEntity(
        id: '',
        title: titleController.text.trim(),
        description: descriptionController.text.trim(),
        address: addressController.text.trim(),
        city: cityController.text.trim(),
        stateName: stateController.text.trim(),
        country: countryController.text.trim(),
        pincode: pincodeController.text.trim(),
        locality: localityController.text.trim(),
        landmark: landmarkController.text.trim(),
        latitude: null,
        longitude: null,
        rent: rent,
        securityDeposit: securityDeposit,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        area: area,
        propertyType: propertyType,
        furnishing: furnishing,
        parking: parking,
        petFriendly: petFriendly,
        imageUrl: '',
        isAvailable: true,
        isVerified: false,
        totalViews: 0,
        pendingVisits: 0,
        createdAt: DateTime.now(),
        views: 0,
        favorites: 0,
        visitRequests: 0,
      );

      await ref
          .read(ownerProvider.notifier)
          .addProperty(
            property,
            area: area,
            bathrooms: bathrooms,
            bedrooms: bedrooms,
            country: countryController.text.trim(),
            furnishing: furnishing,
            landmark: landmarkController.text.trim().isEmpty
                ? null
                : landmarkController.text.trim(),
            latitude: null,
            longitude: null,
            parking: parking,
            petFriendly: petFriendly,
            pincode: pincodeController.text.trim(),
            securityDeposit: securityDeposit,
            stateName: stateController.text.trim(),
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property created successfully')),
      );

      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) {
        return;
      }

      _showError('Failed to create property: $e');
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }

    return null;
  }

  String? _number(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }

    if (double.tryParse(value.trim()) == null) {
      return 'Enter a valid number';
    }

    return null;
  }

  String? _integer(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }

    if (int.tryParse(value.trim()) == null) {
      return 'Enter a valid number';
    }

    return null;
  }

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    rentController.dispose();
    securityDepositController.dispose();
    addressController.dispose();
    localityController.dispose();
    landmarkController.dispose();
    cityController.dispose();
    stateController.dispose();
    countryController.dispose();
    pincodeController.dispose();
    bedroomsController.dispose();
    bathroomsController.dispose();
    areaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Property')),
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
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: rentController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Monthly Rent',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
              ),
              validator: _number,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: securityDepositController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Security Deposit',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
              ),
              validator: _number,
            ),

            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              initialValue: propertyType,
              decoration: const InputDecoration(
                labelText: 'Property Type',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'Apartment', child: Text('Apartment')),
                DropdownMenuItem(value: 'House', child: Text('House')),
                DropdownMenuItem(value: 'Villa', child: Text('Villa')),
                DropdownMenuItem(value: 'Studio', child: Text('Studio')),
                DropdownMenuItem(value: 'Room', child: Text('Room')),
                DropdownMenuItem(value: 'PG', child: Text('PG')),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    propertyType = value;
                  });
                }
              },
            ),

            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              initialValue: furnishing,
              decoration: const InputDecoration(
                labelText: 'Furnishing',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'Unfurnished',
                  child: Text('Unfurnished'),
                ),
                DropdownMenuItem(
                  value: 'Semi Furnished',
                  child: Text('Semi Furnished'),
                ),
                DropdownMenuItem(
                  value: 'Fully Furnished',
                  child: Text('Fully Furnished'),
                ),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    furnishing = value;
                  });
                }
              },
            ),

            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: bedroomsController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Bedrooms',
                      border: OutlineInputBorder(),
                    ),
                    validator: _integer,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: bathroomsController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Bathrooms',
                      border: OutlineInputBorder(),
                    ),
                    validator: _integer,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: areaController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Area (sq ft)',
                border: OutlineInputBorder(),
              ),
              validator: _number,
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
              controller: landmarkController,
              decoration: const InputDecoration(
                labelText: 'Landmark',
                border: OutlineInputBorder(),
              ),
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

            const SizedBox(height: 16),

            TextFormField(
              controller: stateController,
              decoration: const InputDecoration(
                labelText: 'State',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: countryController,
              decoration: const InputDecoration(
                labelText: 'Country',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: pincodeController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Pincode',
                border: OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 8),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Parking'),
              value: parking,
              onChanged: (value) {
                setState(() {
                  parking = value;
                });
              },
            ),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Pet Friendly'),
              value: petFriendly,
              onChanged: (value) {
                setState(() {
                  petFriendly = value;
                });
              },
            ),

            const SizedBox(height: 24),

            SizedBox(
              height: 52,
              child: FilledButton.icon(
                onPressed: loading ? null : _saveProperty,
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
                label: Text(
                  loading ? 'Creating Property...' : 'Create Property',
                ),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
