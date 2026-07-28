import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/maps_provider.dart';
import 'current_location_button.dart';
import 'map_search_bar.dart';
import 'property_marker.dart';

class PropertyMap extends ConsumerStatefulWidget {
  const PropertyMap({super.key});

  @override
  ConsumerState<PropertyMap> createState() =>
      _PropertyMapState();
}

class _PropertyMapState
    extends ConsumerState<PropertyMap> {
  final TextEditingController _searchController =
      TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(mapsProvider);

    return Column(
      children: [

        Padding(
          padding: const EdgeInsets.all(16),
          child: MapSearchBar(
            controller: _searchController,
            onChanged: (value) {
              ref
                  .read(mapsProvider)
                  .updateSearch(value);
            },
            onClear: () {
              _searchController.clear();

              ref
                  .read(mapsProvider)
                  .updateSearch('');
            },
            onVoiceTap: () {
              ScaffoldMessenger.of(context)
                  .showSnackBar(
                const SnackBar(
                  content: Text(
                    'Voice search coming soon.',
                  ),
                ),
              );
            },
          ),
        ),

        Expanded(
          child: Stack(
            children: [

              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius:
                      BorderRadius.circular(18),
                ),
                child: const Center(
                  child: Text(
                    'Google Map\n(API Key Required)',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight:
                          FontWeight.bold,
                    ),
                  ),
                ),
              ),

              Positioned(
                top: 120,
                left: 90,
                child: PropertyMarker(
                  price: '\$220',
                  onTap: () {},
                ),
              ),

              Positioned(
                top: 220,
                right: 80,
                child: PropertyMarker(
                  price: '\$350',
                  isSelected: true,
                  onTap: () {},
                ),
              ),

              Positioned(
                bottom: 16,
                right: 16,
                child: CurrentLocationButton(),
              ),
            ],
          ),
        ),
      ],
    );
  }
}