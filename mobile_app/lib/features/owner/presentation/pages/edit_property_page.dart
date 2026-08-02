import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/owner_property_model.dart';
import '../../providers/owner_provider.dart';

class EditPropertyPage extends ConsumerStatefulWidget {
  final OwnerPropertyModel property;

  const EditPropertyPage({super.key, required this.property});

  @override
  ConsumerState<EditPropertyPage> createState() => _EditPropertyPageState();
}

class _EditPropertyPageState extends ConsumerState<EditPropertyPage> {
  final titleController = TextEditingController();

  final descriptionController = TextEditingController();

  final rentController = TextEditingController();

  final depositController = TextEditingController();

  final locationController = TextEditingController();

  final addressController = TextEditingController();

  String propertyType = 'Apartment';

  String bhk = '1 BHK';

  @override
  void initState() {
    super.initState();

    final property = widget.property;

    titleController.text = property.title;

    descriptionController.text = property.description;

    rentController.text = property.rent.toString();

    depositController.text = property.deposit.toString();

    locationController.text = property.location;

    addressController.text = property.address;

    propertyType = property.propertyType;

    bhk = property.bhk;
  }

  Future<void> updateProperty() async {
    final data = {
      "title": titleController.text,

      "description": descriptionController.text,

      "propertyType": propertyType,

      "bhk": bhk,

      "rent": double.tryParse(rentController.text) ?? 0,

      "deposit": double.tryParse(depositController.text) ?? 0,

      "location": locationController.text,

      "address": addressController.text,
    };

    try {
      await ref
          .read(ownerProvider.notifier)
          .updateProperty(widget.property.id, data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Property Updated Successfully')),
        );

        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Property')),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),

        child: Column(
          children: [
            _field(titleController, 'Property Title', Icons.home),

            _field(
              descriptionController,

              'Description',

              Icons.description,

              maxLines: 3,
            ),

            DropdownButtonFormField<String>(
              initialValue: propertyType,

              decoration: const InputDecoration(
                labelText: 'Property Type',

                border: OutlineInputBorder(),
              ),

              items: const [
                DropdownMenuItem(value: 'Apartment', child: Text('Apartment')),

                DropdownMenuItem(value: 'Villa', child: Text('Villa')),

                DropdownMenuItem(value: 'House', child: Text('House')),
              ],

              onChanged: (value) {
                setState(() {
                  propertyType = value ?? 'Apartment';
                });
              },
            ),

            const SizedBox(height: 15),

            DropdownButtonFormField<String>(
              initialValue: bhk,

              decoration: const InputDecoration(
                labelText: 'BHK',

                border: OutlineInputBorder(),
              ),

              items: const [
                DropdownMenuItem(value: '1 BHK', child: Text('1 BHK')),

                DropdownMenuItem(value: '2 BHK', child: Text('2 BHK')),

                DropdownMenuItem(value: '3 BHK', child: Text('3 BHK')),
              ],

              onChanged: (value) {
                setState(() {
                  bhk = value ?? '1 BHK';
                });
              },
            ),

            const SizedBox(height: 15),

            _field(
              rentController,

              'Monthly Rent',

              Icons.currency_rupee,

              keyboard: TextInputType.number,
            ),

            _field(
              depositController,

              'Deposit',

              Icons.money,

              keyboard: TextInputType.number,
            ),

            _field(locationController, 'Location', Icons.location_on),

            _field(addressController, 'Address', Icons.map, maxLines: 2),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,

              child: ElevatedButton(
                onPressed: updateProperty,

                child: const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,

    String label,

    IconData icon, {

    int maxLines = 1,

    TextInputType? keyboard,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),

      child: TextField(
        controller: controller,

        maxLines: maxLines,

        keyboardType: keyboard,

        decoration: InputDecoration(
          labelText: label,

          prefixIcon: Icon(icon),

          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  @override
  void dispose() {
    titleController.dispose();

    descriptionController.dispose();

    rentController.dispose();

    depositController.dispose();

    locationController.dispose();

    addressController.dispose();

    super.dispose();
  }
}
