import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/dio_provider.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../maps/models/location_model.dart';
import '../../../maps/presentation/pages/map_picker_page.dart';
import '../../../maps/providers/maps_provider.dart';
import '../../data/api/property_image_api.dart';
import '../../data/api/property_video_api.dart';
import '../../domain/entities/owner_property_entity.dart';
import '../../providers/owner_provider.dart';
import '../widgets/sectioned_property_image_picker.dart';

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
  bool parking = false, petFriendly = false, dailyRentEnabled = false;
  bool socialMarketingConsent = false, aiSuggesting = false, loading = false;
  bool _amenitiesLoading = true;
  String? _amenitiesError;
  LocationModel? selectedLocation;
  Map<String, List<File>> selectedImagesBySection = const {};
  PlatformFile? selectedVideo;
  List<Map<String, dynamic>> _amenities = const [];
  final Set<String> _selectedAmenityIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) { _loadCurrentLocation(); _loadAmenities(); });
  }

  Future<void> _loadAmenities() async {
    if (mounted) setState(() { _amenitiesLoading = true; _amenitiesError = null; });
    try {
      final response = await ref.read(dioProvider).get('/amenities');
      dynamic value = response.data;
      while (value is Map && value.containsKey('data')) value = value['data'];
      if (value is Map && value['amenities'] is List) value = value['amenities'];
      if (value is! List) throw const FormatException('Unexpected amenities response.');
      final items = value.whereType<Map>().map(Map<String, dynamic>.from).where((a) => a['id'] != null).toList();
      if (mounted) setState(() { _amenities = items; _amenitiesLoading = false; });
    } catch (_) {
      if (mounted) setState(() { _amenities = const []; _amenitiesLoading = false; _amenitiesError = 'Amenities could not be loaded.'; });
    }
  }

  void _applyLocation(LocationModel location) => setState(() {
    selectedLocation = location;
    if (location.address.isNotEmpty) addressController.text = location.address;
    if (location.locality.isNotEmpty) localityController.text = location.locality;
    if (location.city.isNotEmpty) cityController.text = location.city;
    if (location.state.isNotEmpty) stateController.text = location.state;
    if (location.country.isNotEmpty) countryController.text = location.country;
    if (location.postalCode.isNotEmpty) pincodeController.text = location.postalCode;
  });

  Future<void> _loadCurrentLocation() async {
    final maps = ref.read(mapsProvider); await maps.fetchCurrentLocation();
    if (mounted && maps.selectedLocation != null) _applyLocation(maps.selectedLocation!);
  }
  Future<void> _pickLocation() async {
    final value = await Navigator.of(context).push<LocationModel>(MaterialPageRoute(builder: (_) => const MapPickerPage()));
    if (value != null && mounted) _applyLocation(value);
  }
  Future<void> _pickVideo() async {
    final video = await FilePicker.pickFile(type: FileType.custom, allowedExtensions: const ['mp4','mov','m4v']);
    if (video == null || !mounted) return;
    if (await video.length() > 100 * 1024 * 1024) { _showError('The property video must not exceed 100 MB.'); return; }
    setState(() => selectedVideo = video);
  }

  Future<void> _suggestWithAi() async {
    setState(() => aiSuggesting = true);
    try {
      final response = await ref.read(dioProvider).post('/properties/ai-suggestion', data: {
        'propertyType': propertyType, 'city': cityController.text.trim(), 'locality': localityController.text.trim(),
        'bedrooms': int.tryParse(bedroomsController.text), 'furnishing': furnishing,
        'rent': double.tryParse(rentController.text),
        'amenities': _amenities.where((a) => _selectedAmenityIds.contains(a['id'].toString())).map((a) => a['name']?.toString()).whereType<String>().toList(),
      });
      dynamic value = response.data; while (value is Map && value.containsKey('data')) value = value['data'];
      final title = value is Map ? value['title']?.toString().trim() : null;
      final description = value is Map ? value['description']?.toString().trim() : null;
      if (title == null || title.isEmpty || description == null || description.isEmpty) throw const FormatException('AI returned an incomplete suggestion.');
      if (mounted) setState(() { titleController.text = title; descriptionController.text = description; });
    } on DioException catch (e) {
      if (mounted) _showError(_aiErrorMessage(e));
    } catch (_) {
      if (mounted) _showError('Unable to generate suggestion. Please try again.');
    }
    finally { if (mounted) setState(() => aiSuggesting = false); }
  }

  String _aiErrorMessage(DioException error) {
    final data = error.response?.data;
    dynamic value = data;
    while (value is Map && value.containsKey('data')) value = value['data'];
    final message = value is Map ? value['message'] : null;
    if (message is String && message.trim().isNotEmpty) return message.trim();
    if (message is List && message.isNotEmpty) return message.join(' ');
    return 'Unable to generate suggestion. Please try again.';
  }

  String? _required(String? v) => v == null || v.trim().isEmpty ? context.tr('required') : null;
  String? _number(String? v) => _required(v) ?? (double.tryParse(v!.trim()) == null ? context.tr('validNumber') : null);
  String? _integer(String? v) => _required(v) ?? (int.tryParse(v!.trim()) == null ? context.tr('validNumber') : null);
  void _showError(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

  Future<void> _saveProperty() async {
    if (!_formKey.currentState!.validate()) return;
    final rent = double.tryParse(rentController.text.trim());
    final dailyRent = double.tryParse(dailyRentController.text.trim());
    final deposit = double.tryParse(securityDepositController.text.trim());
    final bedrooms = int.tryParse(bedroomsController.text.trim());
    final bathrooms = int.tryParse(bathroomsController.text.trim());
    final area = double.tryParse(areaController.text.trim());
    if (rent == null || deposit == null || bedrooms == null || bathrooms == null || area == null || (dailyRentEnabled && dailyRent == null)) { _showError(context.tr('validNumericDetails')); return; }
    if (selectedLocation == null) { _showError('Select the property location on the map before submitting.'); return; }
    setState(() => loading = true);
    try {
      final property = OwnerPropertyEntity(id: '', title: titleController.text.trim(), description: descriptionController.text.trim(), address: addressController.text.trim(), city: cityController.text.trim(), stateName: stateController.text.trim(), country: countryController.text.trim(), pincode: pincodeController.text.trim(), locality: localityController.text.trim(), landmark: landmarkController.text.trim(), latitude: selectedLocation!.latitude, longitude: selectedLocation!.longitude, rent: rent, securityDeposit: deposit, bedrooms: bedrooms, bathrooms: bathrooms, area: area, propertyType: propertyType, furnishing: furnishing, parking: parking, petFriendly: petFriendly, imageUrl: '', isAvailable: false, isVerified: false, totalViews: 0, pendingVisits: 0, createdAt: DateTime.now(), views: 0, favorites: 0, visitRequests: 0);
      final created = await ref.read(ownerProvider.notifier).addProperty(property, area: area, bathrooms: bathrooms, bedrooms: bedrooms, country: countryController.text.trim(), furnishing: furnishing, landmark: landmarkController.text.trim().isEmpty ? null : landmarkController.text.trim(), latitude: selectedLocation!.latitude, longitude: selectedLocation!.longitude, parking: parking, petFriendly: petFriendly, pincode: pincodeController.text.trim(), securityDeposit: deposit, stateName: stateController.text.trim(), dailyRentEnabled: dailyRentEnabled, dailyRent: dailyRent, amenityIds: _selectedAmenityIds.toList());
      if (selectedImagesBySection.isNotEmpty) await PropertyImageApi(ref.read(dioProvider)).uploadSectionImages(propertyId: created.id, imagesBySection: selectedImagesBySection);
      if (selectedVideo != null) await PropertyVideoApi(ref.read(dioProvider)).uploadVideo(propertyId: created.id, video: selectedVideo!);
      if (socialMarketingConsent) await ref.read(dioProvider).post('/social-media/owner/consent', data: {'propertyId': created.id, 'approved': true, 'consentVersion': '1.0'});
      if (!mounted) return; ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.tr('propertyCreated')))); Navigator.of(context).pop(true);
    } catch (e) { if (mounted) _showError('${context.tr('createPropertyFailed')}: $e'); }
    finally { if (mounted) setState(() => loading = false); }
  }

  Widget _text(TextEditingController c, String label, {TextInputType? keyboard, int maxLines = 1, String? Function(String?)? validator}) => Padding(padding: const EdgeInsets.only(bottom: 16), child: TextFormField(controller: c, keyboardType: keyboard, maxLines: maxLines, decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()), validator: validator ?? _required));

  Widget _amenitiesSection() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(children: [const Expanded(child: Text('Amenities', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))), if (!_amenitiesLoading && _amenitiesError == null && _amenities.isNotEmpty) Text('${_selectedAmenityIds.length} selected', style: Theme.of(context).textTheme.bodySmall)]),
    const SizedBox(height: 4),
    const Text('Select all amenities available at this property.'),
    const SizedBox(height: 8),
    if (_amenitiesLoading) const Row(children: [SizedBox(width: 18,height:18,child:CircularProgressIndicator(strokeWidth:2)),SizedBox(width:10),Text('Loading amenities…')])
    else if (_amenitiesError != null) Row(children: [Expanded(child: Text(_amenitiesError!)), TextButton.icon(onPressed: _loadAmenities, icon: const Icon(Icons.refresh), label: const Text('Retry'))])
    else if (_amenities.isEmpty) Row(children: [const Expanded(child: Text('No amenities are available right now.')), TextButton(onPressed: _loadAmenities, child: const Text('Retry'))])
    else ..._amenities.map((a) {
      final id = a['id'].toString();
      final name = a['name']?.toString().trim();
      final selected = _selectedAmenityIds.contains(id);
      return SwitchListTile.adaptive(
        contentPadding: EdgeInsets.zero,
        dense: true,
        title: Text(name == null || name.isEmpty ? 'Amenity' : name),
        value: selected,
        onChanged: loading ? null : (value) => setState(() { if (value) { _selectedAmenityIds.add(id); } else { _selectedAmenityIds.remove(id); } }),
      );
    }),
    const SizedBox(height: 16),
  ]);

  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: Text(context.tr('addProperty'))), body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(16), children: [
    Align(alignment: Alignment.centerRight, child: OutlinedButton.icon(onPressed: aiSuggesting ? null : _suggestWithAi, icon: aiSuggesting ? const SizedBox(width:16,height:16,child:CircularProgressIndicator(strokeWidth:2)) : const Icon(Icons.auto_awesome_outlined), label: Text(aiSuggesting ? 'Generating…' : 'Improve with AI'))), const SizedBox(height:8),
    _text(titleController, context.tr('propertyTitle')), _text(descriptionController, context.tr('description'), maxLines: 4),
    _text(rentController, context.tr('monthlyRent'), keyboard: const TextInputType.numberWithOptions(decimal:true), validator:_number),
    SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(context.tr('perDayRent')), subtitle: Text(context.tr('perDayRentDescription')), value: dailyRentEnabled, onChanged: loading ? null : (v)=>setState(()=>dailyRentEnabled=v)),
    if (dailyRentEnabled) _text(dailyRentController, context.tr('rentPerDay'), keyboard: const TextInputType.numberWithOptions(decimal:true), validator:_number),
    _text(securityDepositController, context.tr('securityDeposit'), keyboard: const TextInputType.numberWithOptions(decimal:true), validator:_number),
    DropdownButtonFormField<String>(initialValue: propertyType, decoration: InputDecoration(labelText: context.tr('propertyType'), border: const OutlineInputBorder()), items: const ['Apartment','House','Villa','Studio','Room','PG'].map((v)=>DropdownMenuItem(value:v,child:Text(v))).toList(), onChanged:(v){if(v!=null)setState(()=>propertyType=v);}), const SizedBox(height:16),
    DropdownButtonFormField<String>(initialValue: furnishing, decoration: InputDecoration(labelText: context.tr('furnishing'), border: const OutlineInputBorder()), items: const ['Unfurnished','Semi Furnished','Fully Furnished'].map((v)=>DropdownMenuItem(value:v,child:Text(v))).toList(), onChanged:(v){if(v!=null)setState(()=>furnishing=v);}), const SizedBox(height:16),
    Row(children:[Expanded(child:_text(bedroomsController,context.tr('bedrooms'),keyboard:TextInputType.number,validator:_integer)),const SizedBox(width:12),Expanded(child:_text(bathroomsController,context.tr('bathrooms'),keyboard:TextInputType.number,validator:_integer))]),
    _text(areaController, context.tr('areaSqFt'), keyboard: const TextInputType.numberWithOptions(decimal:true), validator:_number), _amenitiesSection(),
    Text(context.tr('propertyLocation'),style:const TextStyle(fontSize:18,fontWeight:FontWeight.bold)), const SizedBox(height:8), OutlinedButton.icon(onPressed:loading?null:_pickLocation,icon:const Icon(Icons.location_on_outlined),label:Text(selectedLocation==null?context.tr('gettingCurrentLocation'):context.tr('changeLocationMap'))), if(selectedLocation!=null) Padding(padding:const EdgeInsets.only(top:8,bottom:16),child:Text('${context.tr('coordinates')}: ${selectedLocation!.latitude.toStringAsFixed(6)}, ${selectedLocation!.longitude.toStringAsFixed(6)}')),
    _text(addressController,context.tr('address')), _text(localityController,context.tr('locality')), _text(landmarkController,context.tr('landmark'),validator:(_)=>null), _text(cityController,context.tr('city')), _text(stateController,context.tr('state')), _text(countryController,context.tr('country')), _text(pincodeController,context.tr('pincode'),keyboard:TextInputType.number),
    SwitchListTile(contentPadding:EdgeInsets.zero,title:Text(context.tr('parking')),value:parking,onChanged:(v)=>setState(()=>parking=v)), SwitchListTile(contentPadding:EdgeInsets.zero,title:Text(context.tr('petFriendly')),value:petFriendly,onChanged:(v)=>setState(()=>petFriendly=v)), SwitchListTile(contentPadding:EdgeInsets.zero,title:const Text('Allow promotional content'),subtitle:const Text('RentItEase may prepare marketing content after approval. It will never publish automatically.'),value:socialMarketingConsent,onChanged:(v)=>setState(()=>socialMarketingConsent=v)),
    const SizedBox(height:16), const Text('Video tour (optional)',style:TextStyle(fontSize:18,fontWeight:FontWeight.bold)), const Text('One MP4, MOV or M4V video • up to 60 seconds • 100 MB'), OutlinedButton.icon(onPressed:loading?null:_pickVideo,icon:const Icon(Icons.video_call_outlined),label:Text(selectedVideo==null?'Select video tour':'Selected: ${selectedVideo!.name}',overflow:TextOverflow.ellipsis)), if(selectedVideo!=null) TextButton.icon(onPressed:loading?null:()=>setState(()=>selectedVideo=null),icon:const Icon(Icons.close),label:const Text('Remove selected video')),
    const SizedBox(height:16), Text(context.tr('propertyPhotos'),style:const TextStyle(fontSize:18,fontWeight:FontWeight.bold)), const SizedBox(height:8), SectionedPropertyImagePicker(onImagesChanged:(v)=>selectedImagesBySection=v), const SizedBox(height:24), SizedBox(height:52,child:FilledButton.icon(onPressed:loading?null:_saveProperty,icon:loading?const SizedBox(width:20,height:20,child:CircularProgressIndicator(strokeWidth:2,color:Colors.white)):const Icon(Icons.save),label:Text(loading?context.tr('creatingProperty'):context.tr('createProperty')))), const SizedBox(height:24),
  ])));

  @override
  void dispose() { for (final c in [titleController,descriptionController,rentController,dailyRentController,securityDepositController,addressController,localityController,landmarkController,cityController,stateController,countryController,pincodeController,bedroomsController,bathroomsController,areaController]) { c.dispose(); } super.dispose(); }
}
