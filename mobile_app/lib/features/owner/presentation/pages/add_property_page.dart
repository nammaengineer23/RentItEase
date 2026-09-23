import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart' as fp;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_compress/video_compress.dart';

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
  final balconiesController = TextEditingController(text: '0');
  final floorController = TextEditingController(text: '0');
  final totalFloorsController = TextEditingController(text: '0');
  final areaController = TextEditingController(text: '1000');

  String propertyType = 'House';
  String furnishing = 'Semi Furnished';
  bool parking = false, petFriendly = false, dailyRentEnabled = false;
  bool socialMarketingConsent = false, termsAccepted = false, aiSuggesting = false, loading = false;
  bool videoCompressing = false;
  double videoCompressionProgress = 0;
  bool _amenitiesLoading = true;
  String? _amenitiesError;
  LocationModel? selectedLocation;
  final latitudeController = TextEditingController();
  final longitudeController = TextEditingController();
  Map<String, List<File>> selectedImagesBySection = const {};
  File? selectedVideo;
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
    latitudeController.text = location.latitude.toStringAsFixed(6);
    longitudeController.text = location.longitude.toStringAsFixed(6);
  });

  Future<void> _loadCurrentLocation() async {
    final maps = ref.read(mapsProvider); await maps.fetchCurrentLocation();
    if (mounted && maps.selectedLocation != null) _applyLocation(maps.selectedLocation!);
  }
  Future<void> _pickLocation() async {
    final value = await Navigator.of(context).push<LocationModel>(MaterialPageRoute(builder: (_) => const MapPickerPage()));
    if (value != null && mounted) _applyLocation(value);
  }
  Future<void> _setVideo(File video) async {
    final originalBytes = await video.length();
    if (!mounted) return;
    setState(() { videoCompressing = true; videoCompressionProgress = 0; });
    final subscription = VideoCompress.compressProgress$.listen((progress) {
      if (mounted) setState(() => videoCompressionProgress = progress.clamp(0, 100).toDouble());
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
      if (output == null || !await output.exists()) throw Exception('Video compression failed.');
      final compressedBytes = await output.length();
      if (compressedBytes > 100 * 1024 * 1024) {
        _showError('Compressed video is still larger than 100 MB. Please use a shorter video.');
        return;
      }
      if (mounted) {
        setState(() => selectedVideo = output);
        final before = (originalBytes / (1024 * 1024)).toStringAsFixed(1);
        final after = (compressedBytes / (1024 * 1024)).toStringAsFixed(1);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Video compressed: $before MB → $after MB')));
      }
    } catch (error) {
      if (mounted) _showError('Unable to compress video. Please choose another video.');
    } finally {
      await subscription.cancel();
      if (mounted) setState(() { videoCompressing = false; videoCompressionProgress = 0; });
    }
  }

  Future<void> _pickVideo() async {
    final video = await fp.FilePicker.pickFile(
      type: fp.FileType.custom,
      allowedExtensions: const ['mp4', 'mov', 'm4v'],
    );
    if (video == null || !mounted) return;
    if (video.path == null) {
      _showError('The selected video is not available as a local file.');
      return;
    }
    await _setVideo(File(video.path!));
  }

  Future<void> _recordVideo() async {
    try {
      final recorded = await ImagePicker().pickVideo(
        source: ImageSource.camera,
        maxDuration: const Duration(seconds: 60),
      );
      if (recorded == null || !mounted) return;
      await _setVideo(File(recorded.path));
    } catch (_) {
      if (mounted) {
        _showError('Unable to open the camera. Check camera permission and try again.');
      }
    }
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
      if (mounted) _showError(_requestErrorMessage(e));
    } catch (_) {
      if (mounted) _showError('Unable to generate suggestion. Please try again.');
    }
    finally { if (mounted) setState(() => aiSuggesting = false); }
  }

  String _requestErrorMessage(DioException error) {
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
    if (!termsAccepted) {
      _showError('Please accept the Terms & Conditions to create a property.');
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    final rent = double.tryParse(rentController.text.trim());
    final dailyRent = double.tryParse(dailyRentController.text.trim());
    final deposit = double.tryParse(securityDepositController.text.trim());
    final bedrooms = int.tryParse(bedroomsController.text.trim());
    final bathrooms = int.tryParse(bathroomsController.text.trim());
    final balconies = int.tryParse(balconiesController.text.trim());
    final floor = int.tryParse(floorController.text.trim());
    final totalFloors = int.tryParse(totalFloorsController.text.trim());
    final area = double.tryParse(areaController.text.trim());
    if (rent == null || deposit == null || bedrooms == null || bathrooms == null || balconies == null || floor == null || totalFloors == null || area == null || (dailyRentEnabled && dailyRent == null)) { _showError(context.tr('validNumericDetails')); return; }
    if (selectedLocation == null) { _showError('Select the property location on the map before submitting.'); return; }
    final manualLatitude = double.tryParse(latitudeController.text.trim());
    final manualLongitude = double.tryParse(longitudeController.text.trim());
    if (manualLatitude == null || manualLatitude < -90 || manualLatitude > 90 || manualLongitude == null || manualLongitude < -180 || manualLongitude > 180) {
      _showError('Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    selectedLocation = selectedLocation!.copyWith(latitude: manualLatitude, longitude: manualLongitude);
    setState(() => loading = true);
    try {
      final property = OwnerPropertyEntity(id: '', title: titleController.text.trim(), description: descriptionController.text.trim(), address: addressController.text.trim(), city: cityController.text.trim(), stateName: stateController.text.trim(), country: countryController.text.trim(), pincode: pincodeController.text.trim(), locality: localityController.text.trim(), landmark: landmarkController.text.trim(), latitude: selectedLocation!.latitude, longitude: selectedLocation!.longitude, rent: rent, securityDeposit: deposit, bedrooms: bedrooms, bathrooms: bathrooms, area: area, propertyType: propertyType, furnishing: furnishing, parking: parking, petFriendly: petFriendly, imageUrl: '', isAvailable: false, isVerified: false, totalViews: 0, pendingVisits: 0, createdAt: DateTime.now(), views: 0, favorites: 0, visitRequests: 0);
      final created = await ref.read(ownerProvider.notifier).addProperty(property, area: area, bathrooms: bathrooms, bedrooms: bedrooms, balconies: balconies, floor: floor, totalFloors: totalFloors, country: countryController.text.trim(), furnishing: furnishing, landmark: landmarkController.text.trim().isEmpty ? null : landmarkController.text.trim(), latitude: selectedLocation!.latitude, longitude: selectedLocation!.longitude, parking: parking, petFriendly: petFriendly, pincode: pincodeController.text.trim(), securityDeposit: deposit, stateName: stateController.text.trim(), dailyRentEnabled: dailyRentEnabled, dailyRent: dailyRent, amenityIds: _selectedAmenityIds.toList());
      final warnings = <String>[];
      // Persist consent immediately after the property exists. Optional media
      // failures must never leave an approved listing without its consent row.
      if (socialMarketingConsent) {
        try {
          await ref.read(dioProvider).post('/social-media/owner/consent', data: {'propertyId': created.id, 'approved': true, 'consentVersion': '1.0'});
        } catch (_) {
          warnings.add('promotional consent');
        }
      }
      if (selectedImagesBySection.isNotEmpty) {
        try {
          await PropertyImageApi(ref.read(dioProvider)).uploadSectionImages(propertyId: created.id, imagesBySection: selectedImagesBySection);
        } catch (_) {
          warnings.add('photos');
        }
      }
      if (selectedVideo != null) {
        try {
          await PropertyVideoApi(ref.read(dioProvider)).uploadVideo(propertyId: created.id, video: selectedVideo!);
        } catch (_) {
          warnings.add('video');
        }
      }
      if (!mounted) return;
      final message = warnings.isEmpty
          ? context.tr('propertyCreated')
          : 'Property created successfully. Could not save ${warnings.join(', ')}; you can retry from Edit Property.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      Navigator.of(context).pop(true);
    } on FormatException catch (e) {
      if (mounted) _showError(e.message);
    } on DioException catch (e) {
      if (mounted) _showError('${context.tr('createPropertyFailed')}: ${_requestErrorMessage(e)}');
    } catch (e) {
      if (mounted) _showError('${context.tr('createPropertyFailed')}: ${e.toString().replaceFirst('Exception: ', '')}');
    }
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
    else ..._amenities
        .where((a) {
          final normalizedName = (a['name']?.toString().trim() ?? '').toLowerCase();
          return normalizedName != 'parking' &&
              normalizedName != 'covered parking' &&
              normalizedName != 'pet friendly';
        })
        .map((a) {
      final id = a['id'].toString();
      final name = a['name']?.toString().trim();
      final selected = _selectedAmenityIds.contains(id);
      return SwitchListTile.adaptive(
        contentPadding: EdgeInsets.zero,
        dense: true,
        title: Text(name == null || name.isEmpty ? 'Amenity' : name),
        value: selected,
        onChanged: loading ? null : (value) => setState(() {
          if (value) {
            _selectedAmenityIds.add(id);
          } else {
            _selectedAmenityIds.remove(id);
          }
        }),
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
    Row(children:[Expanded(child:_text(balconiesController,'Balconies',keyboard:TextInputType.number,validator:_integer)),const SizedBox(width:12),Expanded(child:_text(floorController,'Floor',keyboard:TextInputType.number,validator:_integer)),const SizedBox(width:12),Expanded(child:_text(totalFloorsController,'Total floors',keyboard:TextInputType.number,validator:_integer))]),
    _text(areaController, context.tr('areaSqFt'), keyboard: const TextInputType.numberWithOptions(decimal:true), validator:_number), _amenitiesSection(),
    Text(context.tr('propertyLocation'),style:const TextStyle(fontSize:18,fontWeight:FontWeight.bold)), const SizedBox(height:8), OutlinedButton.icon(onPressed:loading?null:_pickLocation,icon:const Icon(Icons.location_on_outlined),label:Text(selectedLocation==null?context.tr('gettingCurrentLocation'):context.tr('changeLocationMap'))), if(selectedLocation!=null) Padding(padding:const EdgeInsets.only(top:8,bottom:16),child:Row(children:[Expanded(child:TextFormField(controller:latitudeController,keyboardType:const TextInputType.numberWithOptions(decimal:true,signed:true),decoration:const InputDecoration(labelText:'Latitude',prefixIcon:Icon(Icons.my_location)))),const SizedBox(width:12),Expanded(child:TextFormField(controller:longitudeController,keyboardType:const TextInputType.numberWithOptions(decimal:true,signed:true),decoration:const InputDecoration(labelText:'Longitude',prefixIcon:Icon(Icons.location_on_outlined))))])),
    _text(addressController,context.tr('address')), _text(localityController,context.tr('locality')), _text(landmarkController,context.tr('landmark'),validator:(_)=>null), _text(cityController,context.tr('city')), _text(stateController,context.tr('state')), _text(countryController,context.tr('country')), _text(pincodeController,context.tr('pincode'),keyboard:TextInputType.number),
    const SizedBox(height:16), const Text('Video tour (optional)',style:TextStyle(fontSize:18,fontWeight:FontWeight.bold)), const Text('One MP4, MOV or M4V video • up to 60 seconds • compressed to 720p before upload'), if(videoCompressing) Padding(padding:const EdgeInsets.symmetric(vertical:8),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('Compressing video… ${videoCompressionProgress.toStringAsFixed(0)}%'),const SizedBox(height:6),LinearProgressIndicator(value:videoCompressionProgress>0?videoCompressionProgress/100:null)])), Wrap(spacing:10,runSpacing:8,children:[FilledButton.icon(onPressed:loading||videoCompressing?null:_recordVideo,icon:const Icon(Icons.videocam_outlined),label:Text(selectedVideo==null?'Record video tour':'Retake video')),OutlinedButton.icon(onPressed:loading||videoCompressing?null:_pickVideo,icon:const Icon(Icons.video_library_outlined),label:Text(selectedVideo==null?'Choose existing video':'Choose another video',overflow:TextOverflow.ellipsis))]), if(selectedVideo!=null) Card(child:ListTile(leading:const Icon(Icons.video_file_outlined),title:Text(selectedVideo!.path.split(Platform.pathSeparator).last,overflow:TextOverflow.ellipsis),subtitle:const Text('Ready to upload when property is created'),trailing:IconButton(onPressed:loading?null:()=>setState(()=>selectedVideo=null),icon:const Icon(Icons.close),tooltip:'Remove selected video'))),
    const SizedBox(height:16), Text(context.tr('propertyPhotos'),style:const TextStyle(fontSize:18,fontWeight:FontWeight.bold)), const SizedBox(height:8), SectionedPropertyImagePicker(selectedImages:selectedImagesBySection,onImagesChanged:(v)=>selectedImagesBySection=v),
    const SizedBox(height:24),
    const Text('Consent & Terms', style: TextStyle(fontSize:18,fontWeight:FontWeight.bold)),
    SwitchListTile(contentPadding:EdgeInsets.zero,title:const Text('Allow promotional content'),subtitle:const Text('RentItEase may prepare marketing content after approval. It will never publish automatically.'),value:socialMarketingConsent,onChanged:loading?null:(v)=>setState(()=>socialMarketingConsent=v)),
    CheckboxListTile(contentPadding:EdgeInsets.zero,controlAffinity:ListTileControlAffinity.leading,title:const Text('I agree to the Terms & Conditions'),subtitle:TextButton(style:TextButton.styleFrom(padding:EdgeInsets.zero,alignment:Alignment.centerLeft),onPressed:()=>launchUrl(Uri.parse('https://rentitease.com/terms')),child:const Text('Read Terms & Conditions • Required to submit this listing')),value:termsAccepted,onChanged:loading?null:(v)=>setState(()=>termsAccepted=v??false)),
    const SizedBox(height:16), SizedBox(height:52,child:FilledButton.icon(onPressed:loading?null:_saveProperty,icon:loading?const SizedBox(width:20,height:20,child:CircularProgressIndicator(strokeWidth:2,color:Colors.white)):const Icon(Icons.save),label:Text(loading?context.tr('creatingProperty'):context.tr('createProperty')))), const SizedBox(height:24),
  ])));

  @override
  void dispose() { for (final c in [titleController,descriptionController,rentController,dailyRentController,securityDepositController,addressController,localityController,landmarkController,cityController,stateController,countryController,pincodeController,bedroomsController,bathroomsController,balconiesController,floorController,totalFloorsController,areaController]) { c.dispose(); } super.dispose(); }
}
