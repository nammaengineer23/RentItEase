import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/dio_provider.dart';
import '../../../maps/models/location_model.dart';
import '../../../maps/presentation/pages/map_picker_page.dart';
import '../../../maps/providers/maps_provider.dart';
import '../widgets/sectioned_property_image_picker.dart';
import '../../data/api/property_image_api.dart';
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
  final dailyRentController = TextEditingController();
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

  String propertyType = 'House';
  String furnishing = 'Semi Furnished';

  bool parking = false;
  bool petFriendly = false;
  bool dailyRentEnabled = false;
  bool termsAccepted = false;
  bool socialMediaConsent = false;
  final Set<String> socialMediaPlatforms = {
    'INSTAGRAM',
    'FACEBOOK',
    'YOUTUBE',
  };
  bool loading = false;
  LocationModel? selectedLocation;
  Map<String, List<File>> selectedImagesBySection = const {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrentLocation();
    });
  }

  void _applyLocation(LocationModel location) {
    setState(() {
      selectedLocation = location;
      if (location.address.isNotEmpty) addressController.text = location.address;
      if (location.city.isNotEmpty) cityController.text = location.city;
      if (location.state.isNotEmpty) stateController.text = location.state;
      if (location.country.isNotEmpty) countryController.text = location.country;
      if (location.postalCode.isNotEmpty) {
        pincodeController.text = location.postalCode;
      }
    });
  }

  Future<void> _loadCurrentLocation() async {
    final provider = ref.read(mapsProvider);
    await provider.fetchCurrentLocation();

    if (!mounted || provider.selectedLocation == null) return;
    _applyLocation(provider.selectedLocation!);
  }

  Future<void> _pickLocation() async {
    final location = await Navigator.of(context).push<LocationModel>(
      MaterialPageRoute(builder: (_) => const MapPickerPage()),
    );

    if (location == null || !mounted) return;

    _applyLocation(location);
  }

  Future<void> _saveProperty() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!termsAccepted) {
      _showError('Please accept the property listing terms and conditions.');
      return;
    }

    if (socialMediaConsent && socialMediaPlatforms.isEmpty) {
      _showError('Select at least one social-media platform.');
      return;
    }

    final rent = double.tryParse(rentController.text.trim());
    final dailyRent = double.tryParse(dailyRentController.text.trim());

    final securityDeposit = double.tryParse(
      securityDepositController.text.trim(),
    );

    final bedrooms = int.tryParse(bedroomsController.text.trim());

    final bathrooms = int.tryParse(bathroomsController.text.trim());

    final area = double.tryParse(areaController.text.trim());

    if (rent == null ||
        (dailyRentEnabled && dailyRent == null) ||
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
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
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

      final createdProperty = await ref
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
            latitude: selectedLocation?.latitude,
            longitude: selectedLocation?.longitude,
            parking: parking,
            petFriendly: petFriendly,
            pincode: pincodeController.text.trim(),
            securityDeposit: securityDeposit,
            stateName: stateController.text.trim(),
            dailyRentEnabled: dailyRentEnabled,
            dailyRent: dailyRent,
            termsAccepted: termsAccepted,
            socialMediaConsent: socialMediaConsent,
            socialMediaPlatforms: socialMediaPlatforms.toList(),
          );

      if (selectedImagesBySection.isNotEmpty) {
        await PropertyImageApi(ref.read(dioProvider)).uploadSectionImages(
          propertyId: createdProperty.id,
          imagesBySection: selectedImagesBySection,
        );
      }

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
    dailyRentController.dispose();
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

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Available for per-day rent'),
              subtitle: const Text(
                'Enable short stays with an owner-defined daily price',
              ),
              value: dailyRentEnabled,
              onChanged: loading
                  ? null
                  : (value) => setState(() => dailyRentEnabled = value),
            ),

            if (dailyRentEnabled) ...[
              TextFormField(
                controller: dailyRentController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Rent Per Day',
                  helperText: 'Set a competitive amount based on demand',
                  prefixText: '₹ ',
                  border: OutlineInputBorder(),
                ),
                validator: dailyRentEnabled ? _number : null,
              ),
              const SizedBox(height: 16),
            ],

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

            const Text(
              'Property Location',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 8),

            OutlinedButton.icon(
              onPressed: loading ? null : _pickLocation,
              icon: const Icon(Icons.location_on_outlined),
              label: Text(
                selectedLocation == null
                    ? 'Getting Current Location…'
                    : 'Change Location on Map',
              ),
            ),

            if (selectedLocation != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Coordinates: '
                  '${selectedLocation!.latitude.toStringAsFixed(6)}, '
                  '${selectedLocation!.longitude.toStringAsFixed(6)}',
                ),
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

            const SizedBox(height: 16),

            const Text(
              'Property Photos',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 8),

            SectionedPropertyImagePicker(
              onImagesChanged: (imagesBySection) {
                selectedImagesBySection = imagesBySection;
              },
            ),

            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'Select up to 2 photos in each section. '
                'The first selected photo will be the primary cover.',
              ),
            ),

            const SizedBox(height: 24),

            const Text(
              'Terms and permissions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: termsAccepted,
              onChanged: loading
                  ? null
                  : (value) => setState(() => termsAccepted = value ?? false),
              title: const Text(
                'I accept the property listing terms and conditions',
              ),
              subtitle: const Text(
                'I confirm that the property details and photos are accurate, lawful, and that I am authorized to list this property.',
              ),
            ),

            TextButton(
              onPressed: _showPropertyTerms,
              child: const Text('Read property listing terms'),
            ),

            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: socialMediaConsent,
              onChanged: loading
                  ? null
                  : (value) => setState(
                        () => socialMediaConsent = value ?? false,
                      ),
              title: const Text('Allow social-media promotion'),
              subtitle: const Text(
                'Optional: RentItEase may create promotional videos using this listing’s details and photos. An administrator may publish only to the platforms selected below. Automatic posting is disabled.',
              ),
            ),

            if (socialMediaConsent)
              Wrap(
                spacing: 8,
                children: const ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE']
                    .map(
                      (platform) => FilterChip(
                        label: Text(platform),
                        selected: socialMediaPlatforms.contains(platform),
                        onSelected: loading
                            ? null
                            : (selected) => setState(() {
                                  if (selected) {
                                    socialMediaPlatforms.add(platform);
                                  } else {
                                    socialMediaPlatforms.remove(platform);
                                  }
                                }),
                      ),
                    )
                    .toList(),
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

  Future<void> _showPropertyTerms() {
    return showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Property Listing Terms'),
        content: const SingleChildScrollView(
          child: Text(
            '1. You confirm that you own the property or are authorized to list it.\n\n'
            '2. Listing details, pricing, availability, location, and photos must be accurate and must not violate another person’s rights.\n\n'
            '3. RentItEase may verify, moderate, hide, or remove misleading or unlawful listings.\n\n'
            '4. Social-media promotion is optional. If selected, you grant RentItEase permission to create promotional videos and publish them only on your chosen platforms. Automatic posting remains disabled, and you may revoke consent later.\n\n'
            '5. Property listing terms version 1.0 applies to this acceptance.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
