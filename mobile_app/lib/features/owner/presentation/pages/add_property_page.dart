import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
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
  bool socialMarketingConsent = false;
  bool aiSuggesting = false;
  bool loading = false;
  LocationModel? selectedLocation;
  Map<String, List<File>> selectedImagesBySection = const {};
  List<Map<String, dynamic>> _amenities = const [];
  final Set<String> _selectedAmenityIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrentLocation();
      _loadAmenities();
    });
  }

  Future<void> _loadAmenities() async {
    try {
      final response = await ref.read(dioProvider).get('/amenities');
      final value = response.data is Map ? response.data['data'] : response.data;
      if (mounted && value is List) {
        setState(() => _amenities = value.whereType<Map>().map(Map<String, dynamic>.from).toList());
      }
    } catch (_) {}
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
      _showError(context.tr('validNumericDetails'));
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
        // New listings are submitted for admin review and stay hidden until
        // the admin approval endpoint verifies and publishes them.
        isAvailable: false,
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
            amenityIds: _selectedAmenityIds.toList(),
          );

      if (selectedImagesBySection.isNotEmpty) {
        await PropertyImageApi(ref.read(dioProvider)).uploadSectionImages(
          propertyId: createdProperty.id,
          imagesBySection: selectedImagesBySection,
        );
      }

      if (socialMarketingConsent) {
        await ref.read(dioProvider).post(
          '/social-media/owner/consent',
          data: {
            'propertyId': createdProperty.id,
            'approved': true,
            'consentVersion': '1.0',
          },
        );
      }

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('propertyCreated'))),
      );

      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) {
        return;
      }

      _showError('${context.tr('createPropertyFailed')}: $e');
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  Future<void> _suggestWithAi() async {
    setState(() => aiSuggesting = true);
    try {
      final response = await ref.read(dioProvider).post('/properties/ai-suggestion', data: {
        'propertyType': propertyType, 'city': cityController.text.trim(),
        'locality': localityController.text.trim(), 'bedrooms': int.tryParse(bedroomsController.text),
        'furnishing': furnishing, 'rent': double.tryParse(rentController.text),
      });
      dynamic value = response.data; while (value is Map && value.containsKey('data')) { value = value['data']; }
      if (value is Map) { setState(() { titleController.text = value['title']?.toString() ?? titleController.text; descriptionController.text = value['description']?.toString() ?? descriptionController.text; }); }
    } catch (e) { if (mounted) _showError('Unable to generate suggestion: $e'); }
    finally { if (mounted) setState(() => aiSuggesting = false); }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return context.tr('required');
    }

    return null;
  }

  String? _number(String? value) {
    if (value == null || value.trim().isEmpty) {
      return context.tr('required');
    }

    if (double.tryParse(value.trim()) == null) {
      return context.tr('validNumber');
    }

    return null;
  }

  String? _integer(String? value) {
    if (value == null || value.trim().isEmpty) {
      return context.tr('required');
    }

    if (int.tryParse(value.trim()) == null) {
      return context.tr('validNumber');
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
      appBar: AppBar(title: Text(context.tr('addProperty'))),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton.icon(
                onPressed: aiSuggesting ? null : _suggestWithAi,
                icon: aiSuggesting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.auto_awesome_outlined),
                label: Text(aiSuggesting ? 'Generating…' : 'Improve with AI'),
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: titleController,
              decoration: InputDecoration(
                labelText: context.tr('propertyTitle'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: descriptionController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: context.tr('description'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: rentController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: InputDecoration(
                labelText: context.tr('monthlyRent'),
                prefixText: '₹ ',
                border: const OutlineInputBorder(),
              ),
              validator: _number,
            ),

            const SizedBox(height: 16),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.tr('perDayRent')),
              subtitle: Text(context.tr('perDayRentDescription')),
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
                decoration: InputDecoration(
                  labelText: context.tr('rentPerDay'),
                  helperText: context.tr('dailyRentHelper'),
                  prefixText: '₹ ',
                  border: const OutlineInputBorder(),
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
              decoration: InputDecoration(
                labelText: context.tr('securityDeposit'),
                prefixText: '₹ ',
                border: const OutlineInputBorder(),
              ),
              validator: _number,
            ),

            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              initialValue: propertyType,
              decoration: InputDecoration(
                labelText: context.tr('propertyType'),
                border: const OutlineInputBorder(),
              ),
              items: const {
                'Apartment': 'apartment',
                'House': 'house',
                'Villa': 'villa',
                'Studio': 'studio',
                'Room': 'room',
                'PG': 'pg',
              }.entries.map((entry) => DropdownMenuItem(
                    value: entry.key,
                    child: Text(context.tr(entry.value)),
                  )).toList(),
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
              decoration: InputDecoration(
                labelText: context.tr('furnishing'),
                border: const OutlineInputBorder(),
              ),
              items: const {
                'Unfurnished': 'unfurnished',
                'Semi Furnished': 'semiFurnished',
                'Fully Furnished': 'fullyFurnished',
              }.entries.map((entry) => DropdownMenuItem(
                    value: entry.key,
                    child: Text(context.tr(entry.value)),
                  )).toList(),
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
                    decoration: InputDecoration(
                      labelText: context.tr('bedrooms'),
                      border: const OutlineInputBorder(),
                    ),
                    validator: _integer,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: bathroomsController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: context.tr('bathrooms'),
                      border: const OutlineInputBorder(),
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
              decoration: InputDecoration(
                labelText: context.tr('areaSqFt'),
                border: const OutlineInputBorder(),
              ),
              validator: _number,
            ),

            const SizedBox(height: 16),

            if (_amenities.isNotEmpty) ...[
              const Text('Amenities', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Wrap(
                spacing: 8,
                children: _amenities.map((amenity) {
                  final id = amenity['id'].toString();
                  return FilterChip(
                    label: Text(amenity['name']?.toString() ?? 'Amenity'),
                    selected: _selectedAmenityIds.contains(id),
                    onSelected: (selected) => setState(() => selected ? _selectedAmenityIds.add(id) : _selectedAmenityIds.remove(id)),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],

            Text(
              context.tr('propertyLocation'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 8),

            OutlinedButton.icon(
              onPressed: loading ? null : _pickLocation,
              icon: const Icon(Icons.location_on_outlined),
              label: Text(
                selectedLocation == null
                    ? context.tr('gettingCurrentLocation')
                    : context.tr('changeLocationMap'),
              ),
            ),

            if (selectedLocation != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '${context.tr('coordinates')}: '
                  '${selectedLocation!.latitude.toStringAsFixed(6)}, '
                  '${selectedLocation!.longitude.toStringAsFixed(6)}',
                ),
              ),

            const SizedBox(height: 16),

            TextFormField(
              controller: addressController,
              decoration: InputDecoration(
                labelText: context.tr('address'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: localityController,
              decoration: InputDecoration(
                labelText: context.tr('locality'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: landmarkController,
              decoration: InputDecoration(
                labelText: context.tr('landmark'),
                border: const OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: cityController,
              decoration: InputDecoration(
                labelText: context.tr('city'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: stateController,
              decoration: InputDecoration(
                labelText: context.tr('state'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: countryController,
              decoration: InputDecoration(
                labelText: context.tr('country'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: pincodeController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: context.tr('pincode'),
                border: const OutlineInputBorder(),
              ),
              validator: _required,
            ),

            const SizedBox(height: 8),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.tr('parking')),
              value: parking,
              onChanged: (value) {
                setState(() {
                  parking = value;
                });
              },
            ),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.tr('petFriendly')),
              value: petFriendly,
              onChanged: (value) {
                setState(() {
                  petFriendly = value;
                });
              },
            ),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Allow promotional content'),
              subtitle: const Text(
                'RentItEase may prepare marketing content after approval. It will never publish automatically.',
              ),
              value: socialMarketingConsent,
              onChanged: (value) => setState(() => socialMarketingConsent = value),
            ),

            const SizedBox(height: 16),

            Text(
              context.tr('propertyPhotos'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 8),

            SectionedPropertyImagePicker(
              onImagesChanged: (imagesBySection) {
                selectedImagesBySection = imagesBySection;
              },
            ),

            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                context.tr('photoSectionHelp'),
              ),
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
                  loading
                      ? context.tr('creatingProperty')
                      : context.tr('createProperty'),
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
