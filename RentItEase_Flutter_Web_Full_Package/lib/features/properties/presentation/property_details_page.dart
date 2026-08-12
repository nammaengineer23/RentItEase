import 'package:flutter/material.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/widgets/page_container.dart';

class PropertyDetailsPage extends StatefulWidget {
  const PropertyDetailsPage({super.key, required this.propertyId});

  final String propertyId;

  @override
  State<PropertyDetailsPage> createState() => _PropertyDetailsPageState();
}

class _PropertyDetailsPageState extends State<PropertyDetailsPage> {
  Map<String, dynamic>? property;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final response = await ApiClient.instance.dio.get('/properties/${widget.propertyId}');
      if (response.data is Map) {
        property = Map<String, dynamic>.from(response.data as Map);
      }
    } catch (_) {
      property = null;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final p = property ?? {};
    return PageContainer(
      title: '${p['title'] ?? 'Property details'}',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${p['description'] ?? 'Property information will appear here.'}'),
              const SizedBox(height: 20),
              Text('Location: ${p['city'] ?? p['location'] ?? '-'}'),
              const SizedBox(height: 8),
              Text('Rent: ₹${p['rent'] ?? p['monthlyRent'] ?? '-'}'),
              const SizedBox(height: 8),
              Text('Deposit: ₹${p['deposit'] ?? '-'}'),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.event),
                label: const Text('Request visit'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
