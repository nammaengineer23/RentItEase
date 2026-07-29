import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../providers/owner_provider.dart';

import '../../../maps/providers/maps_provider.dart';
import '../../../maps/presentation/widgets/location_picker.dart';
import '../../../maps/presentation/widgets/selected_location_card.dart';

class AddPropertyPage extends ConsumerStatefulWidget {
  const AddPropertyPage({super.key});

  @override
  ConsumerState<AddPropertyPage> createState() => _AddPropertyPageState();
}

class _AddPropertyPageState extends ConsumerState<AddPropertyPage> {
  final _formKey = GlobalKey<FormState>();

  //====================================================
  // Controllers
  //====================================================

  final titleController = TextEditingController();

  final descriptionController = TextEditingController();

  final rentController = TextEditingController();

  final depositController = TextEditingController();

  final locationController = TextEditingController();

  final addressController = TextEditingController();

  final areaController = TextEditingController();

  //====================================================
  // Dropdown Values
  //====================================================

  String propertyType = 'Apartment';

  String bhk = '1 BHK';

  String furnishing = 'Semi Furnished';

  String parking = 'Bike';

  int bathrooms = 1;

  int balconies = 1;

  bool isAvailable = true;

  //====================================================
  // Image Picker
  //====================================================

  final ImagePicker _picker = ImagePicker();

  final List<File> images = [];

  //====================================================
  // Amenities
  //====================================================

  final List<String> amenities = [];

  final List<String> amenityOptions = [
    'Parking',

    'Lift',

    'Security',

    'Power Backup',

    'Water Supply',

    'Gym',

    'Swimming Pool',

    'Garden',

    'Club House',

    'Internet',

    'CCTV',

    'Children Park',

    'Gas Pipeline',

    'Visitor Parking',
  ];

  //====================================================
  // Google Maps
  //====================================================

  double? latitude;

  double? longitude;

  bool isLoading = false;

  //====================================================
  // Pick Images From Gallery
  //====================================================

  Future<void> pickFromGallery() async {
    final files = await _picker.pickMultiImage(imageQuality: 80);

    if (files.isEmpty) return;

    setState(() {
      images.addAll(files.map((e) => File(e.path)));
    });
  }

  //====================================================
  // Pick Image From Camera
  //====================================================

  Future<void> pickFromCamera() async {
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );

    if (file == null) return;

    setState(() {
      images.add(File(file.path));
    });
  }

  //====================================================
  // Remove Image
  //====================================================

  void removeImage(int index) {
    setState(() {
      images.removeAt(index);
    });
  }

  //====================================================
  // Toggle Amenities
  //====================================================

  void toggleAmenity(String amenity) {
    setState(() {
      if (amenities.contains(amenity)) {
        amenities.remove(amenity);
      } else {
        amenities.add(amenity);
      }
    });
  }

  //====================================================
  // Validators
  //====================================================

  String? requiredValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'This field is required';
    }

    return null;
  }

  String? amountValidator(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter amount';
    }

    if (double.tryParse(value) == null) {
      return 'Invalid amount';
    }

    return null;
  }

  //====================================================
  // Choose Image Source
  //====================================================

  Future<void> chooseImageSource() async {
    showModalBottomSheet(
      context: context,

      builder: (_) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,

            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),

                title: const Text('Choose from Gallery'),

                onTap: () async {
                  Navigator.pop(context);

                  await pickFromGallery();
                },
              ),

              ListTile(
                leading: const Icon(Icons.camera_alt),

                title: const Text('Take Photo'),

                onTap: () async {
                  Navigator.pop(context);

                  await pickFromCamera();
                },
              ),
            ],
          ),
        );
      },
    );
  }
  //====================================================
  // Build
  //====================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Property')),

      body: Form(
        key: _formKey,

        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,

            children: [
              //==========================================
              // Property Images
              //==========================================
              const Text(
                'Property Images',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 15),

              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: chooseImageSource,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Upload Images'),
                ),
              ),

              const SizedBox(height: 15),

              if (images.isNotEmpty)
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,

                    itemCount: images.length,

                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 12),

                        child: Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(
                                images[index],
                                width: 120,
                                height: 120,
                                fit: BoxFit.cover,
                              ),
                            ),

                            Positioned(
                              right: 0,
                              child: CircleAvatar(
                                radius: 14,
                                backgroundColor: Colors.red,
                                child: IconButton(
                                  padding: EdgeInsets.zero,
                                  icon: const Icon(
                                    Icons.close,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                  onPressed: () => removeImage(index),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

              const SizedBox(height: 30),

              //==========================================
              // Property Information
              //==========================================
              const Text(
                'Property Information',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 18),

              TextFormField(
                controller: titleController,

                validator: requiredValidator,

                decoration: const InputDecoration(
                  labelText: 'Property Title',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.home),
                ),
              ),

              const SizedBox(height: 16),

              TextFormField(
                controller: descriptionController,

                validator: requiredValidator,

                maxLines: 4,

                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.description),
                ),
              ),

              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: propertyType,

                decoration: const InputDecoration(
                  labelText: 'Property Type',

                  border: OutlineInputBorder(),
                ),

                items: const [
                  DropdownMenuItem(
                    value: 'Apartment',
                    child: Text('Apartment'),
                  ),

                  DropdownMenuItem(value: 'Villa', child: Text('Villa')),

                  DropdownMenuItem(value: 'House', child: Text('House')),

                  DropdownMenuItem(value: 'Studio', child: Text('Studio')),
                ],

                onChanged: (value) {
                  setState(() {
                    propertyType = value!;
                  });
                },
              ),

              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: bhk,

                decoration: const InputDecoration(
                  labelText: 'BHK',
                  border: OutlineInputBorder(),
                ),

                items: const [
                  DropdownMenuItem(value: '1 BHK', child: Text('1 BHK')),

                  DropdownMenuItem(value: '2 BHK', child: Text('2 BHK')),

                  DropdownMenuItem(value: '3 BHK', child: Text('3 BHK')),

                  DropdownMenuItem(value: '4 BHK', child: Text('4 BHK')),

                  DropdownMenuItem(value: '5+ BHK', child: Text('5+ BHK')),
                ],

                onChanged: (value) {
                  setState(() {
                    bhk = value!;
                  });
                },
              ),

              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: bathrooms,

                      decoration: const InputDecoration(
                        labelText: 'Bathrooms',

                        border: OutlineInputBorder(),
                      ),

                      items: List.generate(
                        6,
                        (index) => DropdownMenuItem(
                          value: index + 1,
                          child: Text('${index + 1}'),
                        ),
                      ),

                      onChanged: (value) {
                        setState(() {
                          bathrooms = value!;
                        });
                      },
                    ),
                  ),

                  const SizedBox(width: 16),

                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: balconies,

                      decoration: const InputDecoration(
                        labelText: 'Balconies',

                        border: OutlineInputBorder(),
                      ),

                      items: List.generate(
                        6,
                        (index) => DropdownMenuItem(
                          value: index,
                          child: Text('$index'),
                        ),
                      ),

                      onChanged: (value) {
                        setState(() {
                          balconies = value!;
                        });
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              TextFormField(
                controller: areaController,

                validator: requiredValidator,

                keyboardType: TextInputType.number,

                inputFormatters: [FilteringTextInputFormatter.digitsOnly],

                decoration: const InputDecoration(
                  labelText: 'Area (Sq Ft)',

                  border: OutlineInputBorder(),

                  prefixIcon: Icon(Icons.square_foot),
                ),
              ),

              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: furnishing,

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
                  setState(() {
                    furnishing = value!;
                  });
                },
              ),

              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: parking,

                decoration: const InputDecoration(
                  labelText: 'Parking',

                  border: OutlineInputBorder(),
                ),

                items: const [
                  DropdownMenuItem(value: 'None', child: Text('None')),

                  DropdownMenuItem(value: 'Bike', child: Text('Bike')),

                  DropdownMenuItem(value: 'Car', child: Text('Car')),

                  DropdownMenuItem(value: 'Both', child: Text('Both')),
                ],

                onChanged: (value) {
                  setState(() {
                    parking = value!;
                  });
                },
              ),

              const SizedBox(height: 16),

              TextFormField(
                controller: rentController,

                validator: amountValidator,

                keyboardType: TextInputType.number,

                inputFormatters: [FilteringTextInputFormatter.digitsOnly],

                decoration: const InputDecoration(
                  labelText: 'Monthly Rent',

                  prefixIcon: Icon(Icons.currency_rupee),

                  border: OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 16),

              TextFormField(
                controller: depositController,

                validator: amountValidator,

                keyboardType: TextInputType.number,

                inputFormatters: [FilteringTextInputFormatter.digitsOnly],

                decoration: const InputDecoration(
                  labelText: 'Security Deposit',

                  prefixIcon: Icon(Icons.account_balance_wallet),

                  border: OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 20),

              SwitchListTile(
                title: const Text('Available Immediately'),

                value: isAvailable,

                onChanged: (value) {
                  setState(() {
                    isAvailable = value;
                  });
                },
              ),

              //==========================================
              // Property Address
              //==========================================
              const SizedBox(height: 30),

              const Text(
                'Property Address',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 16),

              TextFormField(
                controller: locationController,
                validator: requiredValidator,
                decoration: const InputDecoration(
                  labelText: 'Location / Area',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_city),
                ),
              ),

              const SizedBox(height: 16),

              TextFormField(
                controller: addressController,
                validator: requiredValidator,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Full Address',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.home_work),
                ),
              ),

              //==========================================
              // Google Maps Location
              //==========================================
              const SizedBox(height: 30),

              const Text(
                'Property Location',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 16),

              LocationPicker(
                onLatitudeChanged: (lat) {
                  setState(() {
                    latitude = lat;
                  });
                },
                onLongitudeChanged: (lng) {
                  setState(() {
                    longitude = lng;
                  });
                },
              ),

              const SizedBox(height: 20),

              Consumer(
                builder: (context, ref, child) {
                  return SelectedLocationCard(
                    location: ref.watch(mapsProvider).selectedLocation,
                  );
                },
              ),

              //==========================================
              // Amenities
              //==========================================
              const SizedBox(height: 30),

              const Text(
                'Amenities',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 15),

              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: amenityOptions.map((amenity) {
                  return FilterChip(
                    label: Text(amenity),
                    selected: amenities.contains(amenity),
                    onSelected: (_) {
                      toggleAmenity(amenity);
                    },
                  );
                }).toList(),
              ),

              //==========================================
              // Selected Images Grid
              //==========================================
              if (images.isNotEmpty) ...[
                const SizedBox(height: 30),

                const Text(
                  'Selected Images',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 15),

                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: images.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemBuilder: (context, index) {
                    return Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(images[index], fit: BoxFit.cover),
                          ),
                        ),

                        Positioned(
                          top: 5,
                          right: 5,
                          child: InkWell(
                            onTap: () {
                              removeImage(index);
                            },
                            child: const CircleAvatar(
                              radius: 12,
                              backgroundColor: Colors.red,
                              child: Icon(
                                Icons.close,
                                size: 14,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],

              const SizedBox(height: 35),

              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton.icon(
                  icon: isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.publish),

                  label: Text(isLoading ? 'Publishing...' : 'Publish Property'),

                  onPressed: isLoading ? null : submitProperty,
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
  //====================================================
  // Submit Property
  //====================================================

  Future<void> submitProperty() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload at least one property image.'),
        ),
      );
      return;
    }

    if (latitude == null || longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select property location.')),
      );
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      final data = {
        "title": titleController.text.trim(),
        "description": descriptionController.text.trim(),

        "propertyType": propertyType,
        "bhk": bhk,

        "bathrooms": bathrooms,
        "balconies": balconies,

        "area": double.tryParse(areaController.text) ?? 0,

        "rent": double.tryParse(rentController.text) ?? 0,

        "deposit": double.tryParse(depositController.text) ?? 0,

        "location": locationController.text.trim(),

        "address": addressController.text.trim(),

        "latitude": latitude,

        "longitude": longitude,

        "parking": parking,

        "furnishing": furnishing,

        "amenities": amenities,

        "isAvailable": isAvailable,

        // Later these will become uploaded Firebase URLs.
        "images": images.map((e) => e.path).toList(),
      };

      await ref.read(ownerProvider.notifier).addProperty(data);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property added successfully 🎉')),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to add property.\n$e')));
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  //====================================================
  // Dispose
  //====================================================

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    rentController.dispose();
    depositController.dispose();
    locationController.dispose();
    addressController.dispose();
    areaController.dispose();

    super.dispose();
  }
}
