import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/dio_provider.dart';
import '../../../../core/utils/app_image_url.dart';

const bool _marketplaceEnabled = bool.fromEnvironment(
  'PROPERTY_MARKETPLACE_ENABLED',
  defaultValue: false,
);

class PropertyMarketplacePage extends ConsumerStatefulWidget {
  const PropertyMarketplacePage({super.key});

  @override
  ConsumerState<PropertyMarketplacePage> createState() =>
      _PropertyMarketplacePageState();
}

class _PropertyMarketplacePageState
    extends ConsumerState<PropertyMarketplacePage> {
  String _category = 'SALE';
  String _search = '';
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _properties = const [];
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (_marketplaceEnabled) _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  dynamic _unwrap(dynamic value) {
    while (value is Map && value.containsKey('data')) {
      value = value['data'];
    }
    return value;
  }

  Future<void> _load() async {
    if (!_marketplaceEnabled) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await ref.read(dioProvider).get(
        '/properties',
        queryParameters: {
          'transactionType': _category,
          'isAvailable': true,
          'page': 1,
          'limit': 50,
          if (_search.trim().isNotEmpty) 'search': _search.trim(),
        },
      );
      final payload = _unwrap(response.data);
      dynamic rows = payload;
      if (payload is Map) {
        rows = payload['properties'] ?? payload['items'] ?? payload['results'];
      }
      if (rows is! List) {
        throw const FormatException('Unexpected property-list response.');
      }
      final parsed = rows.whereType<Map>().map(Map<String, dynamic>.from).toList();
      if (mounted) setState(() => _properties = parsed);
    } on DioException catch (error) {
      if (mounted) {
        final data = _unwrap(error.response?.data);
        final message = data is Map ? data['message'] : null;
        setState(() => _error = message is String
            ? message
            : 'Could not load listings. Please try again.');
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not read listings. Please refresh.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _title(Map<String, dynamic> item) =>
      item['title']?.toString() ?? 'Property listing';

  String _location(Map<String, dynamic> item) {
    final locality = item['locality']?.toString();
    final city = item['city']?.toString();
    return [if (locality != null && locality.isNotEmpty) locality,
      if (city != null && city.isNotEmpty) city].join(', ');
  }

  String? _previewImage(Map<String, dynamic> item) {
    final images = item['images'];
    if (images is! List) return null;
    for (final image in images) {
      if (image is Map) {
        final value = image['imageUrl'] ?? image['url'];
        if (value != null && value.toString().trim().isNotEmpty) {
          return AppImageUrl.resolve(value);
        }
      }
    }
    return null;
  }

  String _price(Map<String, dynamic> item) {
    final type = item['transactionType']?.toString() ?? _category;
    final isSale = type == 'SALE' || type == 'SITE_SALE';
    final raw = isSale ? item['askingPrice'] : item['price'];
    if (raw == null) return 'Price available on enquiry';
    final number = raw is num ? raw : num.tryParse(raw.toString());
    if (number == null) return 'Price available on enquiry';
    final suffix = isSale
        ? (item['priceNegotiable'] == true ? ' • Negotiable' : '')
        : ' • Rent/lease';
    return '₹${number.toStringAsFixed(0)}$suffix';
  }

  Future<void> _sendEnquiry(Map<String, dynamic> property) async {
    final id = property['id']?.toString();
    if (id == null || id.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This listing has no valid ID.')),
      );
      return;
    }
    final messageController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final message = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Enquire about this listing'),
        content: Form(
          key: formKey,
          child: TextFormField(
            controller: messageController,
            minLines: 3,
            maxLines: 5,
            maxLength: 2000,
            decoration: const InputDecoration(
              labelText: 'Message',
              hintText: 'Tell the owner what you would like to know…',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              final text = value?.trim() ?? '';
              if (text.length < 5) return 'Please enter at least 5 characters.';
              return null;
            },
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
                Navigator.pop(dialogContext, messageController.text.trim());
              }
            },
            child: const Text('Send enquiry'),
          ),
        ],
      ),
    );
    messageController.dispose();
    if (message == null || !mounted) return;
    try {
      await ref.read(dioProvider).post('/property-enquiries', data: {
        'propertyId': id,
        'message': message,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enquiry sent to the listing owner.')),
        );
      }
    } on DioException catch (error) {
      if (!mounted) return;
      final data = _unwrap(error.response?.data);
      final responseMessage = data is Map ? data['message'] : null;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(responseMessage is String
            ? responseMessage
            : 'Unable to send enquiry. Please try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_marketplaceEnabled) {
      return Scaffold(
        appBar: AppBar(title: const Text('Property Marketplace')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.storefront_outlined, size: 52),
                const SizedBox(height: 16),
                Text('Property sales and long-term leases are not enabled yet.',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center),
                const SizedBox(height: 8),
                const Text('Existing rental listings and bookings are unchanged.',
                    textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Property Marketplace')),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: const [
                    ('SALE', 'House Sale'),
                    ('LEASE', 'House Lease'),
                    ('SITE_RENT', 'Site Rent'),
                    ('SITE_LEASE', 'Site Lease'),
                    ('SITE_SALE', 'Site Sale'),
                  ].map((entry) => ChoiceChip(
                    label: Text(entry.$2),
                    selected: _category == entry.$1,
                    onSelected: (selected) {
                      if (!selected) return;
                      setState(() {
                        _category = entry.$1;
                        _properties = const [];
                      });
                      _load();
                    },
                  )).toList(),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  onChanged: (value) => _search = value,
                  onSubmitted: (_) => _load(),
                  decoration: InputDecoration(
                    hintText: 'Search by title or location',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      tooltip: 'Search',
                      onPressed: _load,
                      icon: const Icon(Icons.arrow_forward),
                    ),
                    border: const OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          if (_loading) const LinearProgressIndicator(),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(children: [
                Expanded(child: Text(_error!, style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                ))),
                TextButton(onPressed: _load, child: const Text('Retry')),
              ]),
            ),
          _properties.isEmpty && !_loading
                ? const Center(child: Text('No listings found for this category.'))
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: _properties.length,
                    separatorBuilder: (_, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = _properties[index];
                      final leaseMonths = item['leaseTermMonths'];
                      final area = item['landArea'];
                      final previewImage = _previewImage(item);
                      final propertyId = item['id']?.toString() ?? '';
                      return Card(
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: propertyId.isEmpty
                              ? null
                              : () => context.push('/marketplace/$propertyId'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (previewImage != null)
                                SizedBox(
                                  height: 190,
                                  width: double.infinity,
                                  child: Image.network(
                                    previewImage,
                                    fit: BoxFit.cover,
                                    webHtmlElementStrategy:
                                        WebHtmlElementStrategy.prefer,
                                    errorBuilder: (_, __, ___) => Container(
                                      color: Theme.of(context)
                                          .colorScheme.surfaceContainerHighest,
                                      child: const Icon(Icons.broken_image_outlined),
                                    ),
                                  ),
                                ),
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(_title(item),
                                        style: Theme.of(context).textTheme.titleMedium),
                                    const SizedBox(height: 4),
                                    Text(_location(item),
                                        style: Theme.of(context).textTheme.bodySmall),
                                    const SizedBox(height: 8),
                                    Text(_price(item),
                                        style: Theme.of(context).textTheme.titleLarge),
                                    if (['LEASE', 'SITE_LEASE'].contains(_category) &&
                                        leaseMonths != null)
                                      Text('Lease term: $leaseMonths months'),
                                    if (['SITE_RENT', 'SITE_LEASE', 'SITE_SALE']
                                            .contains(_category) &&
                                        area != null)
                                      Text('Site area: $area ${item['landAreaUnit'] ?? ''}'),
                                    if (item['description'] != null) ...[
                                      const SizedBox(height: 8),
                                      Text(item['description'].toString(),
                                          maxLines: 3, overflow: TextOverflow.ellipsis),
                                    ],
                                    const SizedBox(height: 12),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: TextButton.icon(
                                        onPressed: propertyId.isEmpty
                                            ? null
                                            : () => context.push('/marketplace/$propertyId'),
                                        icon: const Icon(Icons.arrow_forward),
                                        label: const Text('View details'),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
        ],
        ),
      ),
    );
  }
}
