import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/dio_provider.dart';

const bool _marketplaceEnabled = bool.fromEnvironment(
  'PROPERTY_MARKETPLACE_ENABLED',
  defaultValue: false,
);

class AddMarketplaceListingPage extends ConsumerStatefulWidget {
  const AddMarketplaceListingPage({super.key});

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
  final _leaseMonths = TextEditingController(text: '12');
  final _landArea = TextEditingController();
  final _landUnit = TextEditingController(text: 'sq_ft');
  final _bedrooms = TextEditingController(text: '0');
  final _bathrooms = TextEditingController(text: '0');
  String _category = 'SALE';
  String _propertyType = 'HOUSE';
  bool _negotiable = false;
  bool _roadAccess = false;
  bool _saving = false;

  @override
  void dispose() {
    for (final controller in [
      _title, _description, _address, _locality, _city, _state, _pincode,
      _askingPrice, _leaseMonths, _landArea, _landUnit, _bedrooms, _bathrooms,
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
    if (!_marketplaceEnabled) return;
    if (!_formKey.currentState!.validate()) return;
    if (_category == 'LEASE' && (int.tryParse(_leaseMonths.text) ?? 0) <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid lease duration in months.')),
      );
      return;
    }
    if (_category == 'SITE_SALE' &&
        (double.tryParse(_landArea.text) ?? 0) <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter the site area.')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'price': 0,
        'address': _address.text.trim(),
        'locality': _locality.text.trim(),
        'city': _city.text.trim(),
        'state': _state.text.trim(),
        'country': 'India',
        'pincode': _pincode.text.trim(),
        'bedrooms': int.tryParse(_bedrooms.text) ?? 0,
        'bathrooms': int.tryParse(_bathrooms.text) ?? 0,
        'area': double.tryParse(_landArea.text) ?? 0,
        'propertyType': _propertyType,
        'furnishing': 'UNFURNISHED',
        'parking': false,
        'petFriendly': false,
        'securityDeposit': 0,
        'transactionType': _category,
        if (_category != 'LEASE')
          'askingPrice': double.parse(_askingPrice.text.trim()),
        if (_category != 'LEASE') 'priceNegotiable': _negotiable,
        if (_category == 'LEASE')
          'leaseTermMonths': int.parse(_leaseMonths.text.trim()),
        if (_category == 'SITE_SALE') ...{
          'landArea': double.parse(_landArea.text.trim()),
          'landAreaUnit': _landUnit.text.trim().isEmpty
              ? 'sq_ft'
              : _landUnit.text.trim(),
          'roadAccess': _roadAccess,
        },
      };
      await ref.read(dioProvider).post('/properties', data: payload);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Listing created. Complete review before publication.'),
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
      appBar: AppBar(title: const Text('Add sale or lease listing')),
      body: !_marketplaceEnabled
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Marketplace listing creation is disabled in this build.',
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  DropdownButtonFormField<String>(
                    value: _category,
                    decoration: const InputDecoration(
                      labelText: 'Listing category',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'SALE', child: Text('Property for sale')),
                      DropdownMenuItem(value: 'LEASE', child: Text('Long-term lease')),
                      DropdownMenuItem(value: 'SITE_SALE', child: Text('Vacant site for sale')),
                    ],
                    onChanged: _saving
                        ? null
                        : (value) => setState(() => _category = value ?? 'SALE'),
                  ),
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
                  if (_category != 'LEASE') ...[
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
                  if (_category == 'LEASE')
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
                  if (_category == 'SITE_SALE') ...[
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _landArea,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Site area', border: OutlineInputBorder()),
                      validator: _positiveNumber,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _landUnit,
                      decoration: const InputDecoration(labelText: 'Area unit (e.g. sq_ft, sq_yards)', border: OutlineInputBorder()),
                      validator: _required,
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Road access'),
                      value: _roadAccess,
                      onChanged: _saving ? null : (value) => setState(() => _roadAccess = value),
                    ),
                  ],
                  const SizedBox(height: 12),
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
                  DropdownButtonFormField<String>(
                    value: _propertyType,
                    decoration: const InputDecoration(labelText: 'Property type', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'HOUSE', child: Text('House')),
                      DropdownMenuItem(value: 'APARTMENT', child: Text('Apartment')),
                      DropdownMenuItem(value: 'VILLA', child: Text('Villa')),
                      
                    ],
                    onChanged: _saving ? null : (value) => setState(() => _propertyType = value ?? 'HOUSE'),
                  ),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: _saving ? null : _submit,
                    icon: _saving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.save_outlined),
                    label: Text(_saving ? 'Creating…' : 'Create listing'),
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
