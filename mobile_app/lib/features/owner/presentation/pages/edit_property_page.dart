import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../core/network/dio_provider.dart';
import '../../../maps/models/location_model.dart';
import '../../../maps/presentation/pages/map_picker_page.dart';
import '../../../maps/providers/maps_provider.dart';
import '../../data/api/property_image_api.dart';
import '../../data/models/owner_property_model.dart';
import '../../providers/owner_provider.dart';
import '../widgets/sectioned_property_image_picker.dart';

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
  late final TextEditingController dailyRentController;
  late final TextEditingController securityDepositController;
  late final TextEditingController addressController;
  late final TextEditingController localityController;
  late final TextEditingController landmarkController;
  late final TextEditingController cityController;
  late final TextEditingController stateController;
  late final TextEditingController countryController;
  late final TextEditingController pincodeController;
  late final TextEditingController bedroomsController;
  late final TextEditingController bathroomsController;
  late final TextEditingController areaController;

  late String propertyType;
  late String furnishing;
  late bool parking;
  late bool petFriendly;
  late bool isAvailable;
  late bool dailyRentEnabled;

  bool loading = false;
  bool imagesLoading = true;
  LocationModel? selectedLocation;
  Map<String, List<File>> newImagesBySection = const {};
  Map<String, List<PropertyImageRecord>> existingImagesBySection = const {};

  @override
  void initState() {
    super.initState();
    final property = widget.property;

    titleController = TextEditingController(text: property.title);
    descriptionController = TextEditingController(text: property.description);
    rentController = TextEditingController(text: property.rent.toString());
    dailyRentController = TextEditingController(
      text: property.dailyRent?.toString() ?? '',
    );
    securityDepositController = TextEditingController(
      text: property.securityDeposit.toString(),
    );
    addressController = TextEditingController(text: property.address);
    localityController = TextEditingController(text: property.locality);
    landmarkController = TextEditingController(text: property.landmark);
    cityController = TextEditingController(text: property.city);
    stateController = TextEditingController(text: property.stateName);
    countryController = TextEditingController(text: property.country);
    pincodeController = TextEditingController(text: property.pincode);
    bedroomsController = TextEditingController(
      text: property.bedrooms.toString(),
    );
    bathroomsController = TextEditingController(
      text: property.bathrooms.toString(),
    );
    areaController = TextEditingController(text: property.area.toString());

    propertyType = _displayPropertyType(property.propertyType);
    furnishing = _displayFurnishing(property.furnishing);
    parking = property.parking;
    petFriendly = property.petFriendly;
    isAvailable = property.isAvailable;
    dailyRentEnabled = property.dailyRentEnabled;

    if (property.latitude != null && property.longitude != null) {
      selectedLocation = LocationModel(
        latitude: property.latitude!,
        longitude: property.longitude!,
        address: property.address,
        city: property.city,
        state: property.stateName,
        country: property.country,
        postalCode: property.pincode,
      );
    }

    WidgetsBinding.instance.addPostFrameCallback((_) => _loadImages());
  }

  String _displayPropertyType(String value) {
    switch (value.trim().toUpperCase()) {
      case 'HOUSE':
      case 'INDEPENDENT HOUSE':
        return 'House';
      case 'VILLA':
        return 'Villa';
      case 'STUDIO':
        return 'Studio';
      case 'ROOM':
        return 'Room';
      case 'PG':
        return 'PG';
      default:
        return 'Apartment';
    }
  }

  String _displayFurnishing(String value) {
    switch (value.trim().toUpperCase()) {
      case 'UNFURNISHED':
        return 'Unfurnished';
      case 'FULLY_FURNISHED':
      case 'FULLY FURNISHED':
        return 'Fully Furnished';
      default:
        return 'Semi Furnished';
    }
  }

  Future<void> _loadImages() async {
    try {
      final images = await PropertyImageApi(
        ref.read(dioProvider),
      ).getImages(widget.property.id);
      final grouped = <String, List<PropertyImageRecord>>{};
      for (final image in images) {
        grouped.putIfAbsent(image.section, () => []).add(image);
      }
      if (mounted) {
        setState(() {
          existingImagesBySection = grouped;
          imagesLoading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() => imagesLoading = false);
        _showError('${context.tr('loadPhotosFailed')}: $error');
      }
    }
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

  Future<void> _useCurrentLocation() async {
    final provider = ref.read(mapsProvider);
    await provider.fetchCurrentLocation();
    if (!mounted) return;

    final location = provider.selectedLocation;
    if (location == null) {
      _showError(context.tr('currentLocationUnavailable'));
      return;
    }
    _applyLocation(location);
  }

  Future<void> _pickLocation() async {
    final location = await Navigator.of(context).push<LocationModel>(
      MaterialPageRoute(builder: (_) => const MapPickerPage()),
    );
    if (location != null && mounted) _applyLocation(location);
  }

  Future<void> _deleteExistingImage(PropertyImageRecord image) async {
    try {
      await PropertyImageApi(ref.read(dioProvider)).deleteImage(
        propertyId: widget.property.id,
        imageId: image.id,
      );
    } catch (error) {
      if (mounted) _showError('${context.tr('deletePhotoFailed')}: $error');
      rethrow;
    }
  }

  Future<void> _updateProperty() async {
    if (!_formKey.currentState!.validate()) return;

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

    setState(() => loading = true);
    final source = widget.property;
    final updated = OwnerPropertyModel(
      id: source.id,
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
      dailyRentEnabled: dailyRentEnabled,
      dailyRent: dailyRent,
      securityDeposit: securityDeposit,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      area: area,
      propertyType: propertyType,
      furnishing: furnishing,
      parking: parking,
      petFriendly: petFriendly,
      imageUrl: source.imageUrl,
      isAvailable: isAvailable,
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
      );

      if (newImagesBySection.isNotEmpty) {
        await PropertyImageApi(ref.read(dioProvider)).uploadSectionImages(
          propertyId: source.id,
          imagesBySection: newImagesBySection,
          assignFirstAsPrimary: false,
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('propertyUpdated'))),
      );
      Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        _showError('${context.tr('updatePropertyFailed')}: $error');
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? context.tr('required') : null;

  String? _number(String? value) {
    if (_required(value) != null) return context.tr('required');
    return double.tryParse(value!.trim()) == null
        ? context.tr('validNumber')
        : null;
  }

  String? _integer(String? value) {
    if (_required(value) != null) return context.tr('required');
    return int.tryParse(value!.trim()) == null
        ? context.tr('validNumber')
        : null;
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      validator: validator ?? _required,
    );
  }

  @override
  void dispose() {
    for (final controller in [
      titleController,
      descriptionController,
      rentController,
      dailyRentController,
      securityDepositController,
      addressController,
      localityController,
      landmarkController,
      cityController,
      stateController,
      countryController,
      pincodeController,
      bedroomsController,
      bathroomsController,
      areaController,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('editProperty'))),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _field(titleController, context.tr('propertyTitle')),
            gap,
            _field(
              descriptionController,
              context.tr('description'),
              maxLines: 4,
            ),
            gap,
            _field(
              rentController,
              context.tr('monthlyRent'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: _number,
            ),
            gap,
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.tr('dailyRentAvailable')),
              subtitle: Text(context.tr('perDayRentDescription')),
              value: dailyRentEnabled,
              onChanged: loading
                  ? null
                  : (value) => setState(() => dailyRentEnabled = value),
            ),
            if (dailyRentEnabled) ...[
              _field(
                dailyRentController,
                context.tr('dailyRent'),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: _number,
              ),
              gap,
            ],
            _field(
              securityDepositController,
              context.tr('securityDeposit'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: _number,
            ),
            gap,
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
              }.entries.map((entry) {
                return DropdownMenuItem(
                  value: entry.key,
                  child: Text(context.tr(entry.value)),
                );
              }).toList(),
              onChanged: loading
                  ? null
                  : (value) => setState(() => propertyType = value!),
            ),
            gap,
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
              }.entries.map((entry) {
                return DropdownMenuItem(
                  value: entry.key,
                  child: Text(context.tr(entry.value)),
                );
              }).toList(),
              onChanged: loading
                  ? null
                  : (value) => setState(() => furnishing = value!),
            ),
            gap,
            Row(
              children: [
                Expanded(
                  child: _field(
                    bedroomsController,
                    context.tr('bedrooms'),
                    keyboardType: TextInputType.number,
                    validator: _integer,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _field(
                    bathroomsController,
                    context.tr('bathrooms'),
                    keyboardType: TextInputType.number,
                    validator: _integer,
                  ),
                ),
              ],
            ),
            gap,
            _field(
              areaController,
              context.tr('areaSqFt'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: _number,
            ),
            const SizedBox(height: 24),
            Text(
              context.tr('propertyLocation'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: loading ? null : _useCurrentLocation,
                    icon: const Icon(Icons.my_location),
                    label: Text(context.tr('useCurrent')),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: loading ? null : _pickLocation,
                    icon: const Icon(Icons.map_outlined),
                    label: Text(context.tr('chooseOnMap')),
                  ),
                ),
              ],
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
            gap,
            _field(addressController, context.tr('address')),
            gap,
            _field(localityController, context.tr('locality')),
            gap,
            _field(
              landmarkController,
              context.tr('landmark'),
              validator: (_) => null,
            ),
            gap,
            _field(cityController, context.tr('city')),
            gap,
            _field(stateController, context.tr('state')),
            gap,
            _field(countryController, context.tr('country')),
            gap,
            _field(
              pincodeController,
              context.tr('pincode'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.tr('parking')),
              value: parking,
              onChanged: loading ? null : (value) => setState(() => parking = value),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.tr('petFriendly')),
              value: petFriendly,
              onChanged: loading
                  ? null
                  : (value) => setState(() => petFriendly = value),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.tr('availableForRent')),
              value: isAvailable,
              onChanged: loading
                  ? null
                  : (value) => setState(() => isAvailable = value),
            ),
            const SizedBox(height: 24),
            Text(
              context.tr('propertyPhotos'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            if (imagesLoading)
              const Center(child: CircularProgressIndicator())
            else
              SectionedPropertyImagePicker(
                initialImages: existingImagesBySection,
                onDeleteExisting: _deleteExistingImage,
                onImagesChanged: (images) {
                  newImagesBySection = images;
                },
              ),
            const SizedBox(height: 32),
            SizedBox(
              height: 52,
              child: FilledButton.icon(
                onPressed: loading ? null : _updateProperty,
                icon: loading
                    ? const SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.save),
                label: Text(
                  loading
                      ? context.tr('updating')
                      : context.tr('updateProperty'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
