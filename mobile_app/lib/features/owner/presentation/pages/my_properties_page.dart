import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_localizations.dart';
import '../../providers/owner_provider.dart';
import '../widgets/property_owner_card.dart';

class MyPropertiesPage extends ConsumerStatefulWidget {
  const MyPropertiesPage({super.key});

  @override
  ConsumerState<MyPropertiesPage> createState() => _MyPropertiesPageState();
}

class _MyPropertiesPageState extends ConsumerState<MyPropertiesPage> {
  String _status = 'all';

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(ownerProvider.notifier).loadMyProperties();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);
    final properties = state.properties.where((property) {
      if (_status == 'available') return property.isAvailable;
      if (_status == 'occupied') return !property.isAvailable;
      if (_status == 'visited') return property.visitRequests > 0;
      if (_status == 'completed') {
        return property.visitRequests > 0 && !property.isAvailable;
      }
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('myProperties'))),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/owner/add-property');
        },
        icon: const Icon(Icons.add),
        label: Text(context.tr('addProperty')),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(ownerProvider.notifier).refreshProperties(),
        child: state.loading
            ? const Center(child: CircularProgressIndicator())
            : state.error != null
            ? ListView(
                children: [
                  const SizedBox(height: 120),
                  const Icon(Icons.error_outline, size: 70, color: Colors.red),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(state.error!, textAlign: TextAlign.center),
                  ),
                ],
              )
            : state.properties.isEmpty
            ? ListView(
              children: [
                  const SizedBox(height: 120),
                  const Icon(Icons.home_work_outlined, size: 80, color: Colors.grey),
                  const SizedBox(height: 20),
                  Center(
                    child: Text(
                      context.tr('noPropertiesFound'),
                      style: const TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              )
            : Column(
                children: [
                  SizedBox(
                    height: 58,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      children: [
                        for (final key in const [
                          'all',
                          'available',
                          'occupied',
                          'visited',
                          'completed',
                        ])
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: ChoiceChip(
                              label: Text(context.tr(key)),
                              selected: _status == key,
                              onSelected: (_) =>
                                  setState(() => _status = key),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: properties.isEmpty
                        ? Center(
                            child: Text(context.tr('noStatusProperties')),
                          )
                        : PageView.builder(
                scrollDirection: Axis.vertical,
                itemCount: properties.length,
                itemBuilder: (context, index) {
                  final property = properties[index];

                  return SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                    child: PropertyOwnerCard(
                      property: property,
                      onTap: () {
                        context.push('/owner/property-details', extra: property);
                      },
                      onEdit: () {
                        context.push('/owner/edit-property', extra: property);
                      },
                      onDelete: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: Text(context.tr('deleteProperty')),
                          content: Text(context.tr('deletePropertyQuestion')),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: Text(context.tr('cancel')),
                            ),
                            FilledButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: Text(context.tr('delete')),
                            ),
                          ],
                        ),
                      );

                      if (confirm != true) {
                        return;
                      }

                      await ref
                          .read(ownerProvider.notifier)
                          .deleteProperty(property.id);

                      if (!context.mounted) {
                        return;
                      }

                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(context.tr('propertyDeleted')),
                        ),
                      );
                      },
                    ),
                  );
                },
              ),
                  ),
                ],
              ),
      ),
    );
  }
}
