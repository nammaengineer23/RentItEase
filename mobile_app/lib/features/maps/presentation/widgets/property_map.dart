import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../providers/maps_provider.dart';
import 'current_location_button.dart';
import 'map_search_bar.dart';

class PropertyMap extends ConsumerStatefulWidget {
  const PropertyMap({super.key, this.latitude, this.longitude});

  final double? latitude;
  final double? longitude;

  @override
  ConsumerState<PropertyMap> createState() => _PropertyMapState();
}

class _PropertyMapState extends ConsumerState<PropertyMap> {
  final TextEditingController _searchController = TextEditingController();

  GoogleMapController? _mapController;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final latitude = widget.latitude;
    final longitude = widget.longitude;

    if (latitude == null || longitude == null) {
      return Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(18),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.location_off_outlined, size: 42, color: Colors.grey),
              SizedBox(height: 8),
              Text(
                'Property location not available',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      );
    }

    final propertyPosition = LatLng(latitude, longitude);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: MapSearchBar(
            controller: _searchController,
            onChanged: (value) {
              ref.read(mapsProvider).updateSearch(value);
            },
            onClear: () {
              _searchController.clear();
              ref.read(mapsProvider).updateSearch('');
            },
            onVoiceTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Voice search coming soon.')),
              );
            },
          ),
        ),

        Expanded(
          child: Stack(
            children: [
              GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: propertyPosition,
                  zoom: 15,
                ),
                markers: {
                  Marker(
                    markerId: const MarkerId('property'),
                    position: propertyPosition,
                    infoWindow: const InfoWindow(title: 'Property Location'),
                  ),
                },
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: true,
                mapToolbarEnabled: true,
                compassEnabled: true,
                onMapCreated: (controller) {
                  _mapController = controller;
                },
              ),

              Positioned(
                bottom: 16,
                right: 16,
                child: CurrentLocationButton(mapController: _mapController),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
