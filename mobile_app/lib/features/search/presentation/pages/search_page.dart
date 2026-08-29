import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';

import '../../domain/entities/search_entity.dart';
import '../../providers/search_provider.dart';
import '../../../property/providers/property_provider.dart';
import '../../../property/presentation/widgets/property_card.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key, this.openFilters = false});

  final bool openFilters;

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final searchController = TextEditingController();
  SearchEntity _filters = const SearchEntity();
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadNearest());
    if (widget.openFilters) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _showFilters());
    }
  }

  Future<void> _loadNearest() async {
    setState(() => _hasSearched = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        await ref.read(searchProvider.notifier).search(const SearchEntity());
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      final properties = await ref
          .read(propertyProvider.notifier)
          .getNearbyProperties(
            latitude: position.latitude,
            longitude: position.longitude,
            radius: 25,
          );
      if (properties.isEmpty) {
        await ref.read(searchProvider.notifier).search(const SearchEntity());
      } else {
        ref.read(searchProvider.notifier).showNearby(properties);
      }
    } catch (_) {
      await ref.read(searchProvider.notifier).search(const SearchEntity());
    }
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final filters = _filters.copyWith(
      query: searchController.text.trim(),
      page: 1,
    );
    setState(() {
      _filters = filters;
      _hasSearched = true;
    });
    await ref.read(searchProvider.notifier).search(filters);
  }

  Future<void> _showFilters() async {
    final city = TextEditingController(text: _filters.city);
    final locality = TextEditingController(text: _filters.locality);
    final minRent = TextEditingController(text: _filters.minRent?.toString());
    final maxRent = TextEditingController(text: _filters.maxRent?.toString());
    final minDailyRent = TextEditingController(
      text: _filters.minDailyRent?.toString(),
    );
    final maxDailyRent = TextEditingController(
      text: _filters.maxDailyRent?.toString(),
    );
    String? propertyType = _filters.propertyType;
    int? bedrooms = _filters.bedrooms;
    bool availableOnly = _filters.availableOnly;
    bool parking = _filters.parking;
    bool dailyRentEnabled = _filters.dailyRentEnabled;

    final applied = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.viewInsetsOf(context).bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Filter properties',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: city,
                  decoration: const InputDecoration(
                    labelText: 'City',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: locality,
                  decoration: const InputDecoration(
                    labelText: 'Locality',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: propertyType,
                  decoration: const InputDecoration(
                    labelText: 'Property type',
                    border: OutlineInputBorder(),
                  ),
                  items: const ['Apartment', 'House', 'Villa', 'PG', 'Hostel', 'Office']
                      .map((value) => DropdownMenuItem(
                            value: value.toUpperCase(),
                            child: Text(value),
                          ))
                      .toList(),
                  onChanged: (value) => setSheetState(() => propertyType = value),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: bedrooms,
                  decoration: const InputDecoration(
                    labelText: 'Bedrooms',
                    border: OutlineInputBorder(),
                  ),
                  items: List.generate(
                    5,
                    (index) => DropdownMenuItem(
                      value: index + 1,
                      child: Text('${index + 1} BHK'),
                    ),
                  ),
                  onChanged: (value) => setSheetState(() => bedrooms = value),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: minRent,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Minimum rent',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: maxRent,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Maximum rent',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Available for daily rent'),
                  value: dailyRentEnabled,
                  onChanged: (value) =>
                      setSheetState(() => dailyRentEnabled = value),
                ),
                if (dailyRentEnabled)
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minDailyRent,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Min daily rent',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: maxDailyRent,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Max daily rent',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Available properties only'),
                  value: availableOnly,
                  onChanged: (value) =>
                      setSheetState(() => availableOnly = value),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Parking required'),
                  value: parking,
                  onChanged: (value) => setSheetState(() => parking = value),
                ),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          setState(() => _filters = const SearchEntity());
                          Navigator.pop(sheetContext, false);
                        },
                        child: const Text('Clear'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: () {
                          setState(() {
                            _filters = SearchEntity(
                              query: searchController.text.trim(),
                              city: city.text.trim().isEmpty ? null : city.text.trim(),
                              locality: locality.text.trim().isEmpty
                                  ? null
                                  : locality.text.trim(),
                              propertyType: propertyType,
                              bedrooms: bedrooms,
                              minRent: double.tryParse(minRent.text.trim()),
                              maxRent: double.tryParse(maxRent.text.trim()),
                              dailyRentEnabled: dailyRentEnabled,
                              minDailyRent: dailyRentEnabled
                                  ? double.tryParse(minDailyRent.text.trim())
                                  : null,
                              maxDailyRent: dailyRentEnabled
                                  ? double.tryParse(maxDailyRent.text.trim())
                                  : null,
                              availableOnly: availableOnly,
                              parking: parking,
                            );
                          });
                          Navigator.pop(sheetContext, true);
                        },
                        child: const Text('Apply'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

    city.dispose();
    locality.dispose();
    minRent.dispose();
    maxRent.dispose();
    minDailyRent.dispose();
    maxDailyRent.dispose();

    if (applied == true && mounted) await _search();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(searchProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Properties'),
        actions: [
          IconButton(
            tooltip: 'Filters',
            onPressed: _showFilters,
            icon: const Icon(Icons.tune),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _search(),
              decoration: InputDecoration(
                hintText: 'Search by city, locality or property',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _search,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.error != null
                    ? _SearchMessage(
                        icon: Icons.error_outline,
                        message: state.error!,
                        action: _search,
                      )
                    : !_hasSearched
                        ? const _SearchMessage(
                            icon: Icons.manage_search,
                            message: 'Search or apply filters to find properties.',
                          )
                        : state.results.isEmpty
                            ? const _SearchMessage(
                                icon: Icons.search_off,
                                message: 'No properties found.',
                              )
                            : PageView.builder(
                                scrollDirection: Axis.vertical,
                                itemCount: state.results.length,
                                onPageChanged: (index) {
                                  if (index >= state.results.length - 2 &&
                                      state.hasMore) {
                                    ref.read(searchProvider.notifier).loadMore();
                                  }
                                },
                                itemBuilder: (context, index) {
                                  final property = state.results[index];
                                  return RefreshIndicator(
                                    onRefresh: ref
                                        .read(searchProvider.notifier)
                                        .refresh,
                                    child: SingleChildScrollView(
                                      physics:
                                          const AlwaysScrollableScrollPhysics(),
                                      child: PropertyCard(
                                        property: property,
                                        onTap: () => context.push(
                                          '/property/${property.id}',
                                        ),
                                        onBookVisit: () => context.push(
                                          '/book-visit/${property.id}',
                                          extra: {
                                            'propertyTitle': property.title,
                                            'propertyImage': property
                                                    .imageUrls
                                                    .isNotEmpty
                                                ? property.imageUrls.first
                                                : '',
                                            'ownerName': property.ownerName,
                                          },
                                        ),
                                        onContactOwner: () => context.push(
                                          '/chat?propertyId=${property.id}',
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
          ),
        ],
      ),
    );
  }
}

class _SearchMessage extends StatelessWidget {
  const _SearchMessage({
    required this.icon,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String message;
  final VoidCallback? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 72, color: Colors.grey),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center),
            if (action != null) ...[
              const SizedBox(height: 16),
              FilledButton(onPressed: action, child: const Text('Retry')),
            ],
          ],
        ),
      ),
    );
  }
}
