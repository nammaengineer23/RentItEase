import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../providers/maps_provider.dart';
import '../widgets/current_location_button.dart';
import '../widgets/property_marker_info.dart';

class PropertyMapPage extends ConsumerStatefulWidget {
  const PropertyMapPage({super.key});

  @override
  ConsumerState<PropertyMapPage> createState() => _PropertyMapPageState();
}

class _PropertyMapPageState extends ConsumerState<PropertyMapPage> {
  GoogleMapController? _mapController;

  final TextEditingController _searchController = TextEditingController();

  final Completer<GoogleMapController> _controller = Completer();

  int? selectedMarkerIndex;

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(mapsProvider).fetchCurrentLocation();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  Set<Marker> _buildMarkers(MapsProvider provider) {
    final markers = <Marker>{};

    for (int i = 0; i < provider.nearbyProperties.length; i++) {
      final property = provider.nearbyProperties[i];

      markers.add(
        Marker(
          markerId: MarkerId(i.toString()),
          position: LatLng(property.latitude, property.longitude),
          infoWindow: InfoWindow(title: property.address),
          onTap: () {
            setState(() {
              selectedMarkerIndex = i;
            });
          },
        ),
      );
    }

    return markers;
  }

  Future<void> _moveCamera(double lat, double lng) async {
    if (_mapController == null) return;

    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: LatLng(lat, lng), zoom: 16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(mapsProvider);

    return Scaffold(
      body: Stack(
        children: [
          //--------------------------------------------------
          // Google Map
          //--------------------------------------------------
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

            markers: _buildMarkers(provider),

            onMapCreated: (controller) {
              _mapController = controller;

              if (!_controller.isCompleted) {
                _controller.complete(controller);
              }
            },

            onTap: (latLng) async {
              setState(() {
                selectedMarkerIndex = null;
              });

              await provider.updateLocationFromMap(
                latLng.latitude,
                latLng.longitude,
              );
            },
          ),

          //--------------------------------------------------
          // Search Bar
          //--------------------------------------------------
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Material(
                elevation: 4,
                borderRadius: BorderRadius.circular(30),
                child: TextField(
                  controller: _searchController,

                  textInputAction: TextInputAction.search,

                  decoration: InputDecoration(
                    hintText: 'Search location...',

                    prefixIcon: const Icon(Icons.search),

                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                      },
                    ),

                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide.none,
                    ),
                  ),

                  onSubmitted: (value) async {
                    await provider.searchLocation(value);

                    await _moveCamera(provider.latitude, provider.longitude);
                  },
                ),
              ),
            ),
          ),

          //--------------------------------------------------
          // Current Location Button
          //--------------------------------------------------
          Positioned(
            right: 16,
            bottom: 170,
            child: CurrentLocationButton(mapController: _mapController),
          ),

          //--------------------------------------------------
          // Selected Property Information
          //--------------------------------------------------
          if (selectedMarkerIndex != null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Builder(
                builder: (context) {
                  final property =
                      provider.nearbyProperties[selectedMarkerIndex!];

                  return PropertyMarkerInfo(
                    title: property.address,
                    address: '${property.city}, ${property.state}',
                    price: '₹18,000 / month',
                    imageUrl: '',
                    rating: 4.6,
                    distance: 2.3,

                    onNavigate: () async {
                      await provider.openNavigation();
                    },

                    onViewDetails: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Open Property Details')),
                      );

                      // TODO:
                      // Navigate to PropertyDetailsPage
                      // Navigator.push(...)
                    },
                  );
                },
              ),
            ),

          //--------------------------------------------------
          // Loading Indicator
          //--------------------------------------------------
          if (provider.isLoading)
            Container(
              color: Colors.black12,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
