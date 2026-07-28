import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/maps_provider.dart';

class CurrentLocationButton extends ConsumerWidget {
  const CurrentLocationButton({
    super.key,
  });

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
              await ref
                  .read(mapsProvider)
                  .fetchCurrentLocation();
            },

      child: provider.isLoading
          ? const SizedBox(
              width: 22,
              height: 22,
              child:
                  CircularProgressIndicator(
                strokeWidth: 2.5,
              ),
            )
          : Icon(
              Icons.my_location,
              color: Theme.of(context)
                  .colorScheme
                  .primary,
            ),
    );
  }
}