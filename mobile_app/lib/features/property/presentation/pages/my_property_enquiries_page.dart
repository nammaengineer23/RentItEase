import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/dio_provider.dart';

const bool _marketplaceEnabled = bool.fromEnvironment(
  'PROPERTY_MARKETPLACE_ENABLED',
  defaultValue: false,
);

class MyPropertyEnquiriesPage extends ConsumerStatefulWidget {
  const MyPropertyEnquiriesPage({super.key});

  @override
  ConsumerState<MyPropertyEnquiriesPage> createState() =>
      _MyPropertyEnquiriesPageState();
}

class _MyPropertyEnquiriesPageState
    extends ConsumerState<MyPropertyEnquiriesPage> {
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _items = const [];

  dynamic _unwrap(dynamic value) {
    while (value is Map && value.containsKey('data')) {
      value = value['data'];
    }
    return value;
  }

  @override
  void initState() {
    super.initState();
    if (_marketplaceEnabled) _load();
  }

  Future<void> _load() async {
    if (!_marketplaceEnabled) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response =
          await ref.read(dioProvider).get('/property-enquiries/mine');
      final payload = _unwrap(response.data);
      dynamic rows = payload;
      if (payload is Map) {
        rows = payload['items'] ?? payload['results'] ?? payload['enquiries'];
      }
      if (rows is! List) {
        throw const FormatException('Unexpected enquiry-list response.');
      }
      final items =
          rows.whereType<Map>().map(Map<String, dynamic>.from).toList();
      if (mounted) setState(() => _items = items);
    } on DioException catch (error) {
      final payload = _unwrap(error.response?.data);
      final message = payload is Map ? payload['message'] : null;
      if (mounted) {
        setState(() => _error = message is String
            ? message
            : 'Could not load your enquiries. Please try again.');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not read your enquiries. Please refresh.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _price(Map<String, dynamic> property) {
    final type = property['transactionType']?.toString() ?? '';
    final sale = type == 'SALE' || type == 'SITE_SALE';
    final value = sale ? property['askingPrice'] : property['price'];
    final amount = value is num ? value : num.tryParse(value?.toString() ?? '');
    if (amount == null || amount <= 0) return 'Price not available';
    return sale
        ? '₹${amount.toStringAsFixed(0)}'
        : '₹${amount.toStringAsFixed(0)} / month';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My property enquiries'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: !_marketplaceEnabled
          ? const Center(
              child: Text('Property marketplace is not enabled in this build.'),
            )
          : _loading && _items.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : _error != null && _items.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            FilledButton(
                              onPressed: _load,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _items.isEmpty
                      ? const Center(child: Text('You have not sent any enquiries yet.'))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _items.length,
                            separatorBuilder: (_, index) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final item = _items[index];
                              final property = item['property'];
                              final listing = property is Map
                                  ? Map<String, dynamic>.from(property)
                                  : <String, dynamic>{};
                              final title =
                                  listing['title']?.toString() ?? 'Property listing';
                              final status =
                                  item['status']?.toString() ?? 'OPEN';
                              final created = DateTime.tryParse(
                                item['createdAt']?.toString() ?? '',
                              )?.toLocal();
                              return Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(title,
                                          style: Theme.of(context)
                                              .textTheme.titleMedium),
                                      const SizedBox(height: 4),
                                      Text([
                                        listing['city']?.toString() ?? '',
                                        listing['transactionType']?.toString() ?? '',
                                      ].where((value) => value.isNotEmpty).join(' • ')),
                                      const SizedBox(height: 6),
                                      Text(_price(listing),
                                          style: Theme.of(context)
                                              .textTheme.titleMedium),
                                      const SizedBox(height: 8),
                                      Text(item['message']?.toString() ?? ''),
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Chip(label: Text(status)),
                                          const Spacer(),
                                          if (created != null)
                                            Text(
                                              '${created.day.toString().padLeft(2, '0')}/'
                                              '${created.month.toString().padLeft(2, '0')}/'
                                              '${created.year}',
                                              style: Theme.of(context)
                                                  .textTheme.bodySmall,
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
    );
  }
}
