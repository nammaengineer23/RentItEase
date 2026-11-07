import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart' as fp;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_compress/video_compress.dart';

import '../../../../core/network/dio_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../maps/models/location_model.dart';
import '../../../maps/presentation/pages/map_picker_page.dart';
import '../../../maps/providers/maps_provider.dart';
import '../../data/api/property_image_api.dart';
import '../../data/api/property_video_api.dart';
import '../widgets/sectioned_property_image_picker.dart';

class AddMarketplaceListingPage extends ConsumerStatefulWidget {
  const AddMarketplaceListingPage({super.key, this.propertyId, this.initialCategory = 'SALE', this.initialPropertyType = 'HOUSE'});
  final String? propertyId;
  final String initialCategory;
  final String initialPropertyType;

  @override
  ConsumerState<AddMarketplaceListingPage> createState() =>
      _AddMarketplaceListingPageState();
}

class _AddMarketplaceListingPageState
    extends ConsumerState<AddMarketplaceListingPage> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _address = TextEditingController();
  final _locality = TextEditingController();
  final _city = TextEditingController();
  final _state = TextEditingController();
  final _pincode = TextEditingController();
  final _askingPrice = TextEditingController();
  final _rent = TextEditingController();
  final _leaseMonths = TextEditingController(text: '12');
  final _landArea = TextEditingController();
  String _landUnit = 'sq_ft';
  final _bedrooms = TextEditingController(text: '0');
  final _bathrooms = TextEditingController(text: '0');
  late String _category;
  late String _propertyType;
  bool _negotiable = false;
  bool _roadAccess = false;
  bool _parking = false;
  bool _petFriendly = false;
  String _furnishing = 'UNFURNISHED';
  List<Map<String, dynamic>> _amenities = const [];
  final Set<String> _selectedAmenityIds = {};
  bool _termsAccepted = false;
  bool _socialMarketingConsent = false;
  LocationModel? _selectedLocation;
  static const _areaUnits = <String, String>{'sq_ft': 'Sq. ft.', 'sq_yards': 'Sq. yards', 'sq_meters': 'Sq. metres', 'acres': 'Acres', 'cents': 'Cents'};
  bool _saving = false;
  bool _videoCompressing = false;
  double _videoCompressionProgress = 0;
  Map<String, List<File>> _selectedImagesBySection = const {};
  File? _selectedVideo;
  bool _loadingExisting = false;
  String? _loadError;

  Future<void> _setVideo(File video) async {
    final originalBytes = await video.length();
    if (!mounted) return;
    setState(() { _videoCompressing = true; _videoCompressionProgress = 0; });
    final subscription = VideoCompress.compressProgress$.subscribe((progress) {
      if (mounted) setState(() => _videoCompressionProgress = progress.clamp(0, 100).toDouble());
    });
    try {
      final info = await VideoCompress.compressVideo(
        video.path,
        quality: VideoQuality.Res1280x720Quality,
        deleteOrigin: false,
        includeAudio: true,
        frameRate: 30,
      );
      final output = info?.file;
      if (output == null || !await output.exists()) {
        throw const FormatException('Video compression failed.');
      }
      final compressedBytes = await output.length();
      if (compressedBytes > 100 * 1024 * 1024) {
        throw const FormatException('Compressed video is larger than 100 MB. Please choose a shorter video.');
      }
      if (mounted) {
        setState(() => _selectedVideo = output);
        final before = (originalBytes / (1024 * 1024)).toStringAsFixed(1);
        final after = (compressedBytes / (1024 * 1024)).toStringAsFixed(1);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Video compressed: $before MB → $after MB')),
        );
      }
    } catch (error) {
      if (mounted) {
        final message = error is FormatException ? error.message : 'Unable to compress video. Please choose another video.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      subscription.unsubscribe();
      if (mounted) setState(() { _videoCompressing = false; _videoCompressionProgress = 0; });
    }
  }

  Future<void> _pickVideo() async {
    final picked = await fp.FilePicker.pickFile(
      type: fp.FileType.custom,
      allowedExtensions: const ['mp4', 'mov', 'm4v'],
    );
    if (picked == null || !mounted) return;
    if (picked.path == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('The selected video is not available as a local file.')),
      );
      return;
    }
    await _setVideo(File(picked.path!));
  }

  Future<void> _recordVideo() async {
    try {
      final recorded = await ImagePicker().pickVideo(
        source: ImageSource.camera,
        maxDuration: const Duration(seconds: 60),
      );
      if (recorded != null && mounted) await _setVideo(File(recorded.path));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to open the camera. Check camera permission and try again.')),
        );
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _category = widget.initialCategory;
    _propertyType = widget.initialPropertyType;
    if (widget.propertyId != null) {
      _loadExisting();
    }
  }

  void _applyLocation(LocationModel location) {
    setState(() { _selectedLocation = location; _address.text = location.address; _locality.text = location.locality; _city.text = location.city; _state.text = location.state; _pincode.text = location.postalCode; });
  }

  Future<void> _loadAmenities() async {
    try {
      final response = await ref.read(dioProvider).get('/amenities');
      dynamic value = response.data;
      while (value is Map && value.containsKey('data')) value = value['data'];
      if (value is Map && value['amenities'] is List) value = value['amenities'];
      if (value is List && mounted) setState(() => _amenities = value.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).where((item) => item['id'] != null).toList());
    } catch (_) { /* Amenities are optional; core listing creation remains available. */ }
  }

  Future<void> _loadCurrentLocation() async {
    final maps = ref.read(mapsProvider);
    await maps.fetchCurrentLocation();
    if (mounted && maps.selectedLocation != null) _applyLocation(maps.selectedLocation!);
  }

  Future<void> _pickLocation() async {
    final location = await Navigator.of(context).push<LocationModel>(MaterialPageRoute(builder: (_) => const MapPickerPage()));
    if (location != null && mounted) _applyLocation(location);
  }

  dynamic _unwrap(dynamic value) {
    while (value is Map && value.containsKey('data')) value = value['data'];
    if (value is Map && value['property'] is Map) value = value['property'];
    return value;
  }

  Future<void> _loadExisting() async {
    setState(() { _loadingExisting = true; _loadError = null; });
    try {
      final response = await ref.read(dioProvider).get('/properties/${widget.propertyId}');
      final value = _unwrap(response.data);
      if (value is! Map) throw const FormatException('Unexpected property response.');
      _title.text = value['title']?.toString() ?? '';
      _description.text = value['description']?.toString() ?? '';
      _address.text = value['address']?.toString() ?? '';
      _locality.text = value['locality']?.toString() ?? '';
      _city.text = value['city']?.toString() ?? '';
      _state.text = value['state']?.toString() ?? '';
      _pincode.text = value['pincode']?.toString() ?? '';
      _category = value['transactionType']?.toString() ?? 'SALE';
      _propertyType = value['propertyType']?.toString() ?? 'HOUSE';
      _askingPrice.text = value['askingPrice']?.toString() ?? '';
      // Site rent/lease use the property's regular price field, not askingPrice.
      _rent.text = value['price']?.toString() ?? '';
      _leaseMonths.text = value['leaseTermMonths']?.toString() ?? '12';
      _landArea.text = value['landArea']?.toString() ?? value['area']?.toString() ?? '';
      _landUnit = _areaUnits.containsKey(value['landAreaUnit']?.toString()) ? value['landAreaUnit'].toString() : 'sq_ft';
      _bedrooms.text = value['bedrooms']?.toString() ?? '0';
      _bathrooms.text = value['bathrooms']?.toString() ?? '0';
      _negotiable = value['priceNegotiable'] == true;
      _roadAccess = value['roadAccess'] == true;
      _parking = value['parking'] == true;
      _petFriendly = value['petFriendly'] == true;
      _furnishing = value['furnishing']?.toString() ?? 'UNFURNISHED';
      final existingAmenities = value['amenities'];
      if (existingAmenities is List) {
        final names = existingAmenities.map((item) => item is Map ? item['name']?.toString().toLowerCase() : item.toString().toLowerCase()).whereType<String>().toSet();
        _selectedAmenityIds.addAll(_amenities.where((item) => names.contains(item['name']?.toString().toLowerCase())).map((item) => item['id'].toString()));
      }
      final lat = double.tryParse(value['latitude']?.toString() ?? '');
      final lng = double.tryParse(value['longitude']?.toString() ?? '');
      if (lat != null && lng != null) {
        _selectedLocation = LocationModel(latitude: lat, longitude: lng, address: _address.text, locality: _locality.text, city: _city.text, state: _state.text, country: 'India', postalCode: _pincode.text);
      }
    } catch (_) {
      if (mounted) setState(() => _loadError = 'Could not load this listing for editing.');
    } finally {
      if (mounted) setState(() => _loadingExisting = false);
    }
  }

  @override
  void dispose() {
    for (final controller in [
      _title, _description, _address, _locality, _city, _state, _pincode,
      _askingPrice, _rent, _leaseMonths, _landArea, _bedrooms, _bathrooms,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Required' : null;

  String? _positiveNumber(String? value) {
    final number = double.tryParse(value?.trim() ?? '');
    return number == null || number <= 0 ? 'Enter a number greater than 0' : null;
  }

  Future<void> _submit() async {
    if (_saving) return;
    if (!_termsAccepted) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the Terms & Conditions.'))); return; }
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLocation == null) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select the property location on the map before submitting.'))); return; }
    if (['LEASE', 'SITE_LEASE'].contains(_category) && (int.tryParse(_leaseMonths.text) ?? 0) <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid lease duration in months.')),
      );
      return;
    }
    if ((double.tryParse(_landArea.text) ?? 0) <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid property area.')),
      );
      return;
    }
    if (['LEASE', 'SITE_RENT', 'SITE_LEASE'].contains(_category) && (_rent.text.trim().isEmpty || (double.tryParse(_rent.text.trim()) ?? 0) <= 0)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a positive lease or rent amount.')));
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'price': ['LEASE', 'SITE_RENT', 'SITE_LEASE'].contains(_category) ? double.parse(_rent.text.trim()) : 0,
        'address': _address.text.trim(),
        'locality': _locality.text.trim(),
        'city': _city.text.trim(),
        'state': _state.text.trim(),
        'country': 'India',
        'pincode': _pincode.text.trim(),
        'latitude': _selectedLocation!.latitude,
        'longitude': _selectedLocation!.longitude,
        'bedrooms': int.tryParse(_bedrooms.text) ?? 0,
        'bathrooms': int.tryParse(_bathrooms.text) ?? 0,
        'area': double.parse(_landArea.text.trim()),
        'landArea': double.parse(_landArea.text.trim()),
        'landAreaUnit': _landUnit,
        'propertyType': _propertyType,
        'furnishing': _furnishing,
        'parking': _parking,
        'petFriendly': _petFriendly,
        'amenityIds': _selectedAmenityIds.toList(),
        'securityDeposit': 0,
        'transactionType': _category,
        if (['SALE', 'SITE_SALE'].contains(_category))
          'askingPrice': double.parse(_askingPrice.text.trim()),
        if (['SALE', 'SITE_SALE'].contains(_category)) 'priceNegotiable': _negotiable,
        if (['LEASE', 'SITE_LEASE'].contains(_category))
          'leaseTermMonths': int.parse(_leaseMonths.text.trim()),
        if (['SITE_RENT', 'SITE_LEASE', 'SITE_SALE'].contains(_category)) 'roadAccess': _roadAccess,

      };
      String? targetPropertyId = widget.propertyId;
      if (widget.propertyId == null) {
        final response = await ref.read(dioProvider).post('/properties', data: payload);
        final created = _unwrap(response.data);
        if (created is Map) {
          targetPropertyId = created['id']?.toString() ??
              (created['property'] is Map ? created['property']['id']?.toString() : null);
        }
      } else {
        await ref.read(dioProvider).patch('/properties/${widget.propertyId}', data: payload);
      }

      final mediaWarnings = <String>[];
      if (_socialMarketingConsent && targetPropertyId != null) {
        try { await ref.read(dioProvider).post('/social-media/owner/consent', data: {'propertyId': targetPropertyId, 'approved': true, 'consentVersion': '1.0'}); } catch (_) { mediaWarnings.add('promotional consent'); }
      }
      if (_selectedImagesBySection.isNotEmpty) {
        if (targetPropertyId == null || targetPropertyId.isEmpty) {
          mediaWarnings.add('photos (listing ID was not returned)');
        } else {
          try {
            await PropertyImageApi(ref.read(dioProvider)).uploadSectionImages(
              propertyId: targetPropertyId,
              imagesBySection: _selectedImagesBySection,
            );
          } catch (_) {
            mediaWarnings.add('photos');
          }
        }
      }
      if (_selectedVideo != null) {
        if (targetPropertyId == null || targetPropertyId.isEmpty) {
          mediaWarnings.add('video tour (listing ID was not returned)');
        } else {
          try {
            await PropertyVideoApi(ref.read(dioProvider)).uploadVideo(
              propertyId: targetPropertyId,
              video: _selectedVideo!,
            );
          } catch (_) {
            mediaWarnings.add('video tour');
          }
        }
      }
      if (!mounted) return;
      final successMessage = widget.propertyId == null
          ? 'Listing created. Complete review before publication.'
          : 'Listing updated.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(mediaWarnings.isEmpty
              ? successMessage
              : '$successMessage Could not upload ${mediaWarnings.join(' and ')}; retry from Edit Listing.'),
        ),
      );
      Navigator.of(context).pop(true);
    } on DioException catch (error) {
      if (!mounted) return;
      final data = error.response?.data;
      final message = data is Map ? data['message'] : null;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message is String
              ? message
              : 'Could not create listing. Check the details and retry.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.propertyId == null ? 'Add property listing' : 'Edit property listing')),
      body: _loadingExisting
              ? const Center(child: CircularProgressIndicator())
              : _loadError != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_loadError!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: _loadExisting, child: const Text('Retry')),
                          ],
                        ),
                      ),
                    )
                  : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    switch (_category) {
                      'SALE' => 'House Sale',
                      'LEASE' => 'House Lease',
                      'SITE_RENT' => 'Site Rent',
                      'SITE_LEASE' => 'Site Lease',
                      'SITE_SALE' => 'Site Sale',
                      _ => 'Property listing',
                    },
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  if (['LEASE', 'SITE_RENT', 'SITE_LEASE'].contains(_category))
                    TextFormField(
                      controller: _rent,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: _category == 'LEASE' ? 'Lease amount (INR)' : 'Rent amount (INR)',
                        border: const OutlineInputBorder(),
                      ),
                      validator: _positiveNumber,
                    ),
                  if (['LEASE', 'SITE_RENT', 'SITE_LEASE'].contains(_category))
                    const SizedBox(height: 12),
                  TextFormField(
                    controller: _title,
                    decoration: const InputDecoration(labelText: 'Listing title', border: OutlineInputBorder()),
                    validator: _required,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _description,
                    maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                    validator: _required,
                  ),
                  const SizedBox(height: 12),
                  if (['SALE', 'SITE_SALE'].contains(_category)) ...[
                    TextFormField(
                      controller: _askingPrice,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Asking price (INR)', border: OutlineInputBorder()),
                      validator: _positiveNumber,
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Price negotiable'),
                      value: _negotiable,
                      onChanged: _saving ? null : (value) => setState(() => _negotiable = value),
                    ),
                  ],
                  if (_propertyType == 'HOUSE') ...[
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(child: TextFormField(controller: _bedrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bedrooms', border: OutlineInputBorder()), validator: (value) { final n = int.tryParse(value?.trim() ?? ''); return n == null || n < 0 ? 'Enter valid bedrooms' : null; })),
                      const SizedBox(width: 12),
                      Expanded(child: TextFormField(controller: _bathrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bathrooms', border: OutlineInputBorder()), validator: (value) { final n = int.tryParse(value?.trim() ?? ''); return n == null || n < 0 ? 'Enter valid bathrooms' : null; })),
                    ]),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _furnishing,
                      decoration: const InputDecoration(labelText: 'Furnishing', border: OutlineInputBorder()),
                      items: const [
                        DropdownMenuItem(value: 'UNFURNISHED', child: Text('Unfurnished')),
                        DropdownMenuItem(value: 'SEMI_FURNISHED', child: Text('Semi furnished')),
                        DropdownMenuItem(value: 'FULLY_FURNISHED', child: Text('Fully furnished')),
                      ],
                      onChanged: _saving ? null : (value) { if (value != null) setState(() => _furnishing = value); },
                    ),
                    SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Parking available'), value: _parking, onChanged: _saving ? null : (value) => setState(() => _parking = value)),
                    SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Pet friendly'), value: _petFriendly, onChanged: _saving ? null : (value) => setState(() => _petFriendly = value)),
                    if (_amenities.isNotEmpty) ...[
                      const Text('Amenities', style: TextStyle(fontWeight: FontWeight.w600)),
                      ..._amenities.map((item) {
                        final id = item['id'].toString();
                        return CheckboxListTile(contentPadding: EdgeInsets.zero, value: _selectedAmenityIds.contains(id), title: Text(item['name']?.toString() ?? 'Amenity'), onChanged: _saving ? null : (checked) => setState(() { if (checked == true) { _selectedAmenityIds.add(id); } else { _selectedAmenityIds.remove(id); } }));
                      }),
                    ],
                  ],
                  if (['LEASE', 'SITE_LEASE'].contains(_category))
                    TextFormField(
                      controller: _leaseMonths,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Lease term (months)', border: OutlineInputBorder()),
                      validator: (value) {
                        final months = int.tryParse(value?.trim() ?? '');
                        return months == null || months < 1 || months > 600
                            ? 'Enter 1–600 months'
                            : null;
                      },
                    ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _landArea,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: _propertyType == 'LAND' ? 'Site area' : 'Built-up area',
                      border: const OutlineInputBorder(),
                    ),
                    validator: _positiveNumber,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _landUnit,
                    decoration: const InputDecoration(labelText: 'Area unit', border: OutlineInputBorder()),
                    items: _areaUnits.entries.map((entry) => DropdownMenuItem(value: entry.key, child: Text(entry.value))).toList(),
                    onChanged: _saving ? null : (value) { if (value != null) setState(() => _landUnit = value); },
                  ),
                  if (['SITE_RENT', 'SITE_LEASE', 'SITE_SALE'].contains(_category))
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Road access'),
                      value: _roadAccess,
                      onChanged: _saving ? null : (value) => setState(() => _roadAccess = value),
                    ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(onPressed: _saving ? null : _pickLocation, icon: const Icon(Icons.location_on_outlined), label: Text(_selectedLocation == null ? 'Use current location / Choose on map' : 'Change property location')),
                  if (_selectedLocation != null) Text('Pinned: ${_selectedLocation!.latitude.toStringAsFixed(6)}, ${_selectedLocation!.longitude.toStringAsFixed(6)}'),
                  TextFormField(controller: _address, decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()), validator: _required),
                  const SizedBox(height: 12),
                  TextFormField(controller: _locality, decoration: const InputDecoration(labelText: 'Locality', border: OutlineInputBorder())),
                  const SizedBox(height: 12),
                  TextFormField(controller: _city, decoration: const InputDecoration(labelText: 'City', border: OutlineInputBorder()), validator: _required),
                  const SizedBox(height: 12),
                  TextFormField(controller: _state, decoration: const InputDecoration(labelText: 'State', border: OutlineInputBorder()), validator: _required),
                  const SizedBox(height: 12),
                  TextFormField(controller: _pincode, decoration: const InputDecoration(labelText: 'PIN code', border: OutlineInputBorder()), validator: _required),
                  const SizedBox(height: 12),
                  InputDecorator(
                    decoration: const InputDecoration(labelText: 'Property type', border: OutlineInputBorder()),
                    child: Text(_propertyType == 'LAND' ? 'Site / Land' : 'House'),
                  ),
                  const SizedBox(height: 16),
                  CheckboxListTile(contentPadding: EdgeInsets.zero, value: _termsAccepted, onChanged: _saving ? null : (value) => setState(() => _termsAccepted = value ?? false), title: Wrap(children: [const Text('I accept the '), InkWell(onTap: () => launchUrl(Uri.parse('https://rentitease.com/terms'), mode: LaunchMode.externalApplication), child: const Text('Terms & Conditions', style: TextStyle(decoration: TextDecoration.underline))), const Text(' (required)')])),
                  CheckboxListTile(contentPadding: EdgeInsets.zero, value: _socialMarketingConsent, onChanged: _saving ? null : (value) => setState(() => _socialMarketingConsent = value ?? false), title: const Text('I agree to promotional use of this property listing on RentItEase social channels (optional).')),
                  const SizedBox(height: 24),
                  Text('Property photos', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(_propertyType == 'LAND'
                      ? 'Add clear photos of the plot, frontage, road access and surroundings.'
                      : 'Add clear photos of the exterior and available rooms.'),
                  const SizedBox(height: 8),
                  SectionedPropertyImagePicker(
                    isLand: _propertyType == 'LAND',
                    selectedImages: _selectedImagesBySection,
                    onImagesChanged: (images) => _selectedImagesBySection = images,
                  ),
                  const SizedBox(height: 24),
                  Text('Video tour (optional)', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  const Text('One MP4, MOV or M4V video • up to 60 seconds • compressed to 720p before upload.'),
                  if (_videoCompressing) ...[
                    const SizedBox(height: 8),
                    Text('Compressing video… ${_videoCompressionProgress.toStringAsFixed(0)}%'),
                    LinearProgressIndicator(
                      value: _videoCompressionProgress > 0 ? _videoCompressionProgress / 100 : null,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    children: [
                      FilledButton.icon(
                        onPressed: _saving || _videoCompressing ? null : _recordVideo,
                        icon: const Icon(Icons.videocam_outlined),
                        label: Text(_selectedVideo == null ? 'Record video tour' : 'Retake video'),
                      ),
                      OutlinedButton.icon(
                        onPressed: _saving || _videoCompressing ? null : _pickVideo,
                        icon: const Icon(Icons.video_library_outlined),
                        label: Text(_selectedVideo == null ? 'Choose existing video' : 'Choose another video'),
                      ),
                    ],
                  ),
                  if (_selectedVideo != null)
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.video_file_outlined),
                        title: Text(
                          _selectedVideo!.path.split(Platform.pathSeparator).last,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: const Text('Ready to upload when the listing is saved'),
                        trailing: IconButton(
                          onPressed: _saving ? null : () => setState(() => _selectedVideo = null),
                          icon: const Icon(Icons.close),
                          tooltip: 'Remove selected video',
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: _saving ? null : _submit,
                    icon: _saving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.save_outlined),
                    label: Text(_saving ? 'Saving…' : widget.propertyId == null ? 'Create listing' : 'Save changes'),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Listings are not published automatically. Complete the required review and verification workflow before sharing them publicly.',
                  ),
                ],
              ),
            ),
    );
  }
}
