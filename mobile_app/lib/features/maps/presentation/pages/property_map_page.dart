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

  final Completer<GoogleMapController> _controller =
      Completer<GoogleMapController>();

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

  //==================================================
  // Build Property Markers
  //==================================================

  Set<Marker> _buildMarkers(MapsProvider provider) {
    final markers = <Marker>{};

    for (int i = 0; i < provider.nearbyProperties.length; i++) {
      final property = provider.nearbyProperties[i];

      markers.add(
        Marker(
          markerId: MarkerId(property.id),
          position: LatLng(property.latitude, property.longitude),
          infoWindow: InfoWindow(
            title: property.title,
            snippet: property.address,
          ),
          onTap: () {
            setState(() {
              selectedMarkerIndex = i;
            });

            provider.selectProperty(property);
          },
        ),
      );
    }

    return markers;
  }

  //==================================================
  // Move Camera
  //==================================================

  Future<void> _moveCamera(double latitude, double longitude) async {
    if (_mapController == null) return;

    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: LatLng(latitude, longitude), zoom: 16),
      ),
    );
  }

  //==================================================
  // Close Selected Property
  //==================================================

  void _clearSelectedProperty() {
    setState(() {
      selectedMarkerIndex = null;
    });
  }

  //==================================================
  // Build
  //==================================================

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(mapsProvider);

    return Scaffold(
      body: Stack(
        children: [
          //==================================================
          // Google Map
          //==================================================
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
              _clearSelectedProperty();

              await provider.updateLocationFromMap(
                latLng.latitude,
                latLng.longitude,
              );
            },
          ),

          //==================================================
          // Search Bar
          //==================================================
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

                    filled: true,
                  ),

                  onSubmitted: (value) async {
                    if (value.trim().isEmpty) return;

                    await provider.searchLocation(value);

                    await _moveCamera(provider.latitude, provider.longitude);
                  },
                ),
              ),
            ),
          ),

          //==================================================
          // Current Location Button
          //==================================================
          Positioned(
            right: 16,
            bottom: 170,
            child: CurrentLocationButton(mapController: _mapController),
          ),

          //==================================================
          // Selected Property Information
          //==================================================
          if (selectedMarkerIndex != null &&
              selectedMarkerIndex! < provider.nearbyProperties.length)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Builder(
                builder: (context) {
                  final property =
                      provider.nearbyProperties[selectedMarkerIndex!];

                  return PropertyMarkerInfo(
                    title: property.title,

                    address: '${property.locality}, ${property.city}',

                    price: '₹${property.rent.toStringAsFixed(0)} / month',

                    imageUrl: property.imageUrls.isNotEmpty
                        ? property.imageUrls.first.toString()
                        : '',

                    rating: property.rating,

                    distance: provider.distanceFrom(
                      userLatitude: provider.latitude,
                      userLongitude: provider.longitude,
                    ),

                    onNavigate: () async {
                      await provider.openPropertyNavigation(property);
                    },

                    onViewDetails: () {
                      // Property details navigation
                      // will be connected here.
                    },
                  );
                },
              ),
            ),

          //==================================================
          // Loading Indicator
          //==================================================
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
