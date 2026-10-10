import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/dio_provider.dart';

const bool _marketplaceEnabled = bool.fromEnvironment(
  'PROPERTY_MARKETPLACE_ENABLED',
  defaultValue: false,
);

class OwnerPropertyEnquiriesPage extends ConsumerStatefulWidget {
  const OwnerPropertyEnquiriesPage({super.key});

  @override
  ConsumerState<OwnerPropertyEnquiriesPage> createState() =>
      _OwnerPropertyEnquiriesPageState();
}

class _OwnerPropertyEnquiriesPageState
    extends ConsumerState<OwnerPropertyEnquiriesPage> {
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _enquiries = const [];

  @override
  void initState() {
    super.initState();
    if (_marketplaceEnabled) _load();
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
      final response =
          await ref.read(dioProvider).get('/property-enquiries/owner');
      final payload = _unwrap(response.data);
      dynamic rows = payload;
      if (payload is Map) {
        rows = payload['items'] ?? payload['results'] ?? payload['enquiries'];
      }
      if (rows is! List) {
        throw const FormatException('Unexpected enquiry-list response.');
      }
      final values =
          rows.whereType<Map>().map(Map<String, dynamic>.from).toList();
      if (mounted) setState(() => _enquiries = values);
    } on DioException catch (error) {
      if (mounted) {
        final data = _unwrap(error.response?.data);
        final message = data is Map ? data['message'] : null;
        setState(() => _error = message is String
            ? message
            : 'Could not load enquiries. Please try again.');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not read enquiries. Please refresh.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _setStatus(String id, String status) async {
    try {
      await ref.read(dioProvider).patch(
        '/property-enquiries/$id/status',
        data: {'status': status},
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Enquiry marked $status.')),
      );
      await _load();
    } on DioException catch (error) {
      if (!mounted) return;
      final data = _unwrap(error.response?.data);
      final message = data is Map ? data['message'] : null;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message is String
              ? message
              : 'Could not update this enquiry. Please retry.'),
        ),
      );
    }
  }

  String _listingTitle(Map<String, dynamic> enquiry) {
    final property = enquiry['property'];
    if (property is Map) {
      final title = property['title']?.toString().trim();
      if (title != null && title.isNotEmpty) return title;
    }
    return 'Property enquiry';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Property enquiries'),
        actions: [
          IconButton(
            tooltip: 'Refresh enquiries',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: !_marketplaceEnabled
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Property sales, leases and site listings are not enabled '
                  'in this build.',
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : _loading && _enquiries.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : _error != null && _enquiries.isEmpty
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
                  : _enquiries.isEmpty
                      ? const Center(
                          child: Text('No property enquiries yet.'),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _enquiries.length,
                            separatorBuilder: (_, index) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final item = _enquiries[index];
                              final id = item['id']?.toString() ?? '';
                              final status =
                                  item['status']?.toString() ?? 'OPEN';
                              final sender = item['sender'];
                              final senderName = sender is Map
                                  ? (sender['name']?.toString() ??
                                      sender['email']?.toString() ??
                                      'Interested user')
                                  : 'Interested user';
                              final message =
                                  item['message']?.toString() ?? '';
                              return Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _listingTitle(item),
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium,
                                      ),
                                      const SizedBox(height: 4),
                                      Text('From: $senderName'),
                                      const SizedBox(height: 8),
                                      Text(message),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Chip(label: Text(status)),
                                          const Spacer(),
                                          PopupMenuButton<String>(
                                            tooltip: 'Change enquiry status',
                                            onSelected: (value) =>
                                                _setStatus(id, value),
                                            itemBuilder: (_) => const [
                                              PopupMenuItem(
                                                value: 'OPEN',
                                                child: Text('Open'),
                                              ),
                                              PopupMenuItem(
                                                value: 'CONTACTED',
                                                child: Text('Contacted'),
                                              ),
                                              PopupMenuItem(
                                                value: 'CLOSED',
                                                child: Text('Close enquiry'),
                                              ),
                                            ],
                                            child: const Padding(
                                              padding: EdgeInsets.all(8),
                                              child: Row(
                                                children: [
                                                  Text('Update status'),
                                                  Icon(Icons.arrow_drop_down),
                                                ],
                                              ),
                                            ),
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
