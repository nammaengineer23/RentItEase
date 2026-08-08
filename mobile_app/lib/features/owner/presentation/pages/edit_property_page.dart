import 'package:flutter/material.dart';

import '../../data/models/owner_property_model.dart';

class EditPropertyPage extends StatefulWidget {
  const EditPropertyPage({super.key, required this.property});

  final OwnerPropertyModel property;

  @override
  State<EditPropertyPage> createState() => _EditPropertyPageState();
}

class _EditPropertyPageState extends State<EditPropertyPage> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController titleController;
  late final TextEditingController descriptionController;
  late final TextEditingController rentController;
  late final TextEditingController addressController;
  late final TextEditingController cityController;
  late final TextEditingController localityController;

  late String propertyType;

  bool loading = false;

  @override
  void initState() {
    super.initState();

    final property = widget.property;

    titleController = TextEditingController(text: property.title);
    descriptionController = TextEditingController(text: property.description);
    rentController = TextEditingController(
      text: property.rent.toStringAsFixed(0),
    );
    addressController = TextEditingController(text: property.address);
    cityController = TextEditingController(text: property.city);
    localityController = TextEditingController(text: property.locality);

    propertyType = property.propertyType;
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

    setState(() => loading = true);

    // TODO:
    // OwnerProvider.updateProperty(...)
    // Backend integration later.

    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    setState(() => loading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Property updated successfully')),
    );

    Navigator.pop(context);
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
              validator: (value) =>
                  value == null || value.isEmpty ? 'Required' : null,
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
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Monthly Rent',
                border: OutlineInputBorder(),
              ),
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
                DropdownMenuItem(value: 'Villa', child: Text('Villa')),
                DropdownMenuItem(
                  value: 'Independent House',
                  child: Text('Independent House'),
                ),
                DropdownMenuItem(value: 'PG', child: Text('PG')),
              ],
              onChanged: (value) {
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
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: localityController,
              decoration: const InputDecoration(
                labelText: 'Locality',
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
