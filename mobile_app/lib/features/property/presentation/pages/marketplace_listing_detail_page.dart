import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/dio_provider.dart';
import '../../../../core/utils/app_image_url.dart';

const bool _marketplaceDetailEnabled = bool.fromEnvironment(
  'PROPERTY_MARKETPLACE_ENABLED',
  defaultValue: false,
);

class MarketplaceListingDetailPage extends ConsumerStatefulWidget {
  const MarketplaceListingDetailPage({super.key, required this.propertyId});

  final String propertyId;

  @override
  ConsumerState<MarketplaceListingDetailPage> createState() =>
      _MarketplaceListingDetailPageState();
}

class _MarketplaceListingDetailPageState
    extends ConsumerState<MarketplaceListingDetailPage> {
  Map<String, dynamic>? _property;
  bool _loading = true;
  String? _error;
  int _imageIndex = 0;

  dynamic _unwrap(dynamic value) {
    while (value is Map && value.containsKey('data')) {
      value = value['data'];
    }
    return value;
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!_marketplaceDetailEnabled) {
      setState(() {
        _loading = false;
        _error = 'Property marketplace is not enabled.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(dioProvider)
          .get('/properties/${widget.propertyId}');
      final payload = _unwrap(response.data);
      final property = payload is Map ? payload['property'] ?? payload : null;
      if (property is! Map) {
        throw const FormatException('Unexpected listing detail response.');
      }
      if (mounted) {
        setState(() => _property = Map<String, dynamic>.from(property));
      }
    } on DioException catch (error) {
      final payload = _unwrap(error.response?.data);
      final message = payload is Map ? payload['message'] : null;
      if (mounted) {
        setState(() => _error = message is String
            ? message
            : 'Could not load this listing. It may no longer be available.');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not read this listing. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _text(dynamic value, [String fallback = 'Not provided']) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? fallback : text;
  }

  String _price(Map<String, dynamic> property) {
    final type = _text(property['transactionType'], '');
    final sale = type == 'SALE' || type == 'SITE_SALE';
    final raw = sale ? property['askingPrice'] : property['price'];
    final amount = raw is num ? raw : num.tryParse(raw?.toString() ?? '');
    if (amount == null || amount <= 0) return 'Price available on enquiry';
    if (sale) {
      return '₹${amount.toStringAsFixed(0)}'
          '${property['priceNegotiable'] == true ? ' • Negotiable' : ''}';
    }
    return '₹${amount.toStringAsFixed(0)} / month';
  }

  List<String> _images(Map<String, dynamic> property) {
    final raw = property['images'];
    if (raw is! List) return const [];
    return raw.whereType<Map>().map((item) {
      final value = item['imageUrl'] ?? item['url'];
      return value == null ? '' : AppImageUrl.resolve(value);
    }).where((url) => url.trim().isNotEmpty).toList();
  }

  Future<void> _sendEnquiry(Map<String, dynamic> property) async {
    final controller = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final message = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Enquire about this listing'),
        content: Form(
          key: formKey,
          child: TextFormField(
            controller: controller,
            minLines: 3,
            maxLines: 5,
            maxLength: 2000,
            decoration: const InputDecoration(
              labelText: 'Message',
              hintText: 'Tell the owner what you would like to know…',
              border: OutlineInputBorder(),
            ),
            validator: (value) => (value?.trim().length ?? 0) < 5
                ? 'Please enter at least 5 characters.'
                : null,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (formKey.currentState?.validate() ?? false) {
                Navigator.pop(dialogContext, controller.text.trim());
              }
            },
            child: const Text('Send enquiry'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (message == null || !mounted) return;
    try {
      await ref.read(dioProvider).post('/property-enquiries', data: {
        'propertyId': widget.propertyId,
        'message': message,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enquiry sent to the listing owner.')),
        );
      }
    } on DioException catch (error) {
      if (!mounted) return;
      final payload = _unwrap(error.response?.data);
      final responseMessage = payload is Map ? payload['message'] : null;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(responseMessage is String
            ? responseMessage
            : 'Unable to send enquiry. Please try again.')),
      );
    }
  }

  Widget _detailRow(String label, dynamic value) {
    if (value == null || value.toString().trim().isEmpty) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 132,
            child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Expanded(
            child: Text(
              value.toString(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final property = _property;
    final images = property == null ? const <String>[] : _images(property);
    return Scaffold(
      appBar: AppBar(title: const Text('Listing details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : property == null
                  ? const Center(child: Text('Listing not found.'))
                  : ListView(
                      padding: const EdgeInsets.only(bottom: 28),
                      children: [
                        if (images.isEmpty)
                          Container(
                            height: 230,
                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                            child: const Icon(Icons.home_work_outlined, size: 64),
                          )
                        else ...[
                          SizedBox(
                            height: 270,
                            child: PageView.builder(
                              itemCount: images.length,
                              onPageChanged: (index) =>
                                  setState(() => _imageIndex = index),
                              itemBuilder: (context, index) => Image.network(
                                images[index],
                                fit: BoxFit.cover,
                                webHtmlElementStrategy:
                                    WebHtmlElementStrategy.prefer,
                                errorBuilder: (_, _, _) => Container(
                                  color: Theme.of(context)
                                      .colorScheme.surfaceContainerHighest,
                                  child: const Icon(Icons.broken_image_outlined,
                                      size: 48),
                                ),
                              ),
                            ),
                          ),
                          if (images.length > 1)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Center(
                                child: Text('${_imageIndex + 1} / ${images.length}'),
                              ),
                            ),
                        ],
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_text(property['title']),
                                  style: Theme.of(context).textTheme.headlineSmall),
                              const SizedBox(height: 6),
                              Text([
                                _text(property['locality'], ''),
                                _text(property['city'], ''),
                                _text(property['state'], ''),
                              ].where((part) => part.isNotEmpty).join(', ')),
                              const SizedBox(height: 12),
                              Text(_price(property),
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                        color: Theme.of(context).colorScheme.primary,
                                        fontWeight: FontWeight.bold,
                                      )),
                              const Divider(height: 28),
                              Text('Property information',
                                  style: Theme.of(context).textTheme.titleLarge),
                              _detailRow('Category', _text(property['transactionType'])),
                              _detailRow('Property type', _text(property['propertyType'])),
                              _detailRow('Built-up area', property['area'] == null
                                  ? null
                                  : '${property['area']} sq.ft'),
                              _detailRow('Site area', property['landArea'] == null
                                  ? null
                                  : '${property['landArea']} ${_text(property['landAreaUnit'], '')}'),
                              _detailRow('Bedrooms', property['bedrooms']),
                              _detailRow('Bathrooms', property['bathrooms']),
                              _detailRow('Lease term', property['leaseTermMonths'] == null
                                  ? null
                                  : '${property['leaseTermMonths']} months'),
                              _detailRow('Road access', property['roadAccess']),
                              _detailRow('Furnishing', property['furnishing']),
                              _detailRow('Parking', property['parking']),
                              const Divider(height: 28),
                              Text('Description',
                                  style: Theme.of(context).textTheme.titleLarge),
                              const SizedBox(height: 8),
                              Text(_text(property['description'])),
                              const SizedBox(height: 12),
                              _detailRow('Address', property['address']),
                              _detailRow('Pincode', property['pincode']),
                              if (property['videoUrl'] != null &&
                                  property['videoUrl'].toString().isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Text('Video tour',
                                    style: Theme.of(context).textTheme.titleMedium),
                                SelectableText(property['videoUrl'].toString()),
                              ],
                              const SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton.icon(
                                  onPressed: () => _sendEnquiry(property),
                                  icon: const Icon(Icons.mail_outline),
                                  label: const Text('Enquire with owner'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
    );
  }
}
