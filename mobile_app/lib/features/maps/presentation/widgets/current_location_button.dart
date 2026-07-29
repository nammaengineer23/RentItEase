import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../providers/maps_provider.dart';

class CurrentLocationButton extends ConsumerWidget {
  const CurrentLocationButton({super.key, this.mapController});

  final GoogleMapController? mapController;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(mapsProvider);

    return FloatingActionButton(
      heroTag: 'current_location',

      mini: true,

      elevation: 6,

      backgroundColor: Colors.white,

      onPressed: provider.isLoading
          ? null
          : () async {
              await ref.read(mapsProvider).fetchCurrentLocation();

              final location = ref.read(mapsProvider).selectedLocation;

              if (location != null && mapController != null) {
                await mapController!.animateCamera(
                  CameraUpdate.newCameraPosition(
                    CameraPosition(
                      target: LatLng(location.latitude, location.longitude),
                      zoom: 17,
                    ),
                  ),
                );
              }
            },

      child: provider.isLoading
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : Icon(
              Icons.my_location,
              color: Theme.of(context).colorScheme.primary,
            ),
    );
  }
}
