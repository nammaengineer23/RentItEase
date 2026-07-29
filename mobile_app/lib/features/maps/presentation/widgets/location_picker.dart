import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/maps_provider.dart';
import 'current_location_button.dart';
import 'map_search_bar.dart';
import 'property_marker.dart';

class LocationPicker extends ConsumerStatefulWidget {
  final ValueChanged<double>? onLatitudeChanged;
  final ValueChanged<double>? onLongitudeChanged;

  const LocationPicker({
    super.key,
    this.onLatitudeChanged,
    this.onLongitudeChanged,
  });

  @override
  ConsumerState<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends ConsumerState<LocationPicker> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(mapsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MapSearchBar(
          controller: _searchController,
          onChanged: (value) {
            ref.read(mapsProvider).updateSearch(value);
          },
          onClear: () {
            _searchController.clear();

            ref.read(mapsProvider).updateSearch('');
          },
          onVoiceTap: () {},
        ),

        const SizedBox(height: 16),

        Container(
          height: 320,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Stack(
            children: [
              const Center(
                child: Text(
                  'Location Picker\n(Google Maps Coming Soon)',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ),

              Center(
                child: GestureDetector(
                  onTap: () {
                    widget.onLatitudeChanged?.call(provider.latitude);

                    widget.onLongitudeChanged?.call(provider.longitude);

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Location selected')),
                    );
                  },
                  child: const PropertyMarker(
                    price: 'Selected',
                    isSelected: true,
                  ),
                ),
              ),

              const Positioned(
                right: 16,
                bottom: 16,
                child: CurrentLocationButton(),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        Card(
          elevation: 0,
          color: Colors.grey.shade100,
          child: ListTile(
            leading: const Icon(Icons.location_on, color: Colors.red),
            title: const Text('Selected Coordinates'),
            subtitle: Text(
              '${provider.latitude.toStringAsFixed(6)}, '
              '${provider.longitude.toStringAsFixed(6)}',
            ),
          ),
        ),

        const SizedBox(height: 12),

        ElevatedButton.icon(
          onPressed: () {
            widget.onLatitudeChanged?.call(provider.latitude);

            widget.onLongitudeChanged?.call(provider.longitude);

            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Property location saved')),
            );
          },
          icon: const Icon(Icons.check),
          label: const Text('Use This Location'),
        ),
      ],
    );
  }
}
