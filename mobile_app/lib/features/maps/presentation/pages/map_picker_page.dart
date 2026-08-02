import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../models/location_model.dart';
import '../../providers/maps_provider.dart';
import '../widgets/current_location_button.dart';

class MapPickerPage extends ConsumerStatefulWidget {
  const MapPickerPage({super.key});

  @override
  ConsumerState<MapPickerPage> createState() => _MapPickerPageState();
}

class _MapPickerPageState extends ConsumerState<MapPickerPage> {
  GoogleMapController? _mapController;

  final Completer<GoogleMapController> _controller = Completer();

  Marker? selectedMarker;

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(mapsProvider).fetchCurrentLocation();
    });
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _moveCamera(double lat, double lng) async {
    if (_mapController == null) return;

    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: LatLng(lat, lng), zoom: 17),
      ),
    );
  }

  void _selectLocation(LatLng position) async {
    await ref
        .read(mapsProvider)
        .updateLocationFromMap(position.latitude, position.longitude);

    setState(() {
      selectedMarker = Marker(
        markerId: const MarkerId('selected_location'),
        position: position,
      );
    });

    await _moveCamera(position.latitude, position.longitude);
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(mapsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Property Location'),
        centerTitle: true,
      ),

      body: Stack(
        children: [
          //------------------------------------------------
          // Google Map
          //------------------------------------------------
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: LatLng(provider.latitude, provider.longitude),
              zoom: provider.zoom,
            ),

            myLocationEnabled: true,
            myLocationButtonEnabled: false,

            zoomControlsEnabled: false,

            compassEnabled: true,

            mapToolbarEnabled: false,

            markers: {?selectedMarker},

            onMapCreated: (controller) {
              _mapController = controller;

              if (!_controller.isCompleted) {
                _controller.complete(controller);
              }
            },

            onTap: _selectLocation,
          ),

          //------------------------------------------------
          // Current Location Button
          //------------------------------------------------
          Positioned(
            right: 16,
            bottom: 170,
            child: CurrentLocationButton(mapController: _mapController),
          ),

          //------------------------------------------------
          // Selected Address Card
          //------------------------------------------------
          if (provider.selectedLocation != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Card(
                elevation: 8,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Selected Location',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 10),

                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.location_on, color: Colors.red),

                          const SizedBox(width: 8),

                          Expanded(
                            child: Text(
                              provider.selectedLocation!.address,
                              style: const TextStyle(fontSize: 15),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      Text(
                        '${provider.selectedLocation!.city}, '
                        '${provider.selectedLocation!.state}',
                        style: TextStyle(color: Colors.grey.shade700),
                      ),

                      const SizedBox(height: 20),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.check),
                          label: const Text('Use This Location'),
                          onPressed: () {
                            Navigator.pop<LocationModel>(
                              context,
                              provider.selectedLocation,
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          //------------------------------------------------
          // Loading Overlay
          //------------------------------------------------
          if (provider.isLoading)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
