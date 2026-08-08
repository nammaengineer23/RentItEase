import 'package:flutter/material.dart';

class AddPropertyPage extends StatefulWidget {
  const AddPropertyPage({super.key});

  @override
  State<AddPropertyPage> createState() => _AddPropertyPageState();
}

class _AddPropertyPageState extends State<AddPropertyPage> {
  final _formKey = GlobalKey<FormState>();

  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  final rentController = TextEditingController();
  final addressController = TextEditingController();
  final cityController = TextEditingController();
  final localityController = TextEditingController();

  String propertyType = 'Apartment';

  bool loading = false;

  Future<void> _saveProperty() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => loading = true);

    // TODO:
    // Call OwnerProvider.addProperty()
    // API integration will be added later.

    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    setState(() => loading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Property added successfully')),
    );

    Navigator.pop(context);
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
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
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
                label: Text(loading ? 'Saving...' : 'Save Property'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
