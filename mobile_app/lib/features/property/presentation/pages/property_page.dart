import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/property_provider.dart';
import '../../widgets/property_card.dart';

class PropertyPage extends ConsumerWidget {
  const PropertyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncProperties = ref.watch(PropertyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Properties')),
      body: asyncProperties.when(
        data: (properties) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: properties.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, index) => PropertyCard(entity: properties[index]),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text('Could not load properties: $error')),
      ),
    );
  }
}
