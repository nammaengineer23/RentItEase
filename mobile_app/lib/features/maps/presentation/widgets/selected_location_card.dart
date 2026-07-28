import 'package:flutter/material.dart';

import '../../models/location_model.dart';

class SelectedLocationCard extends StatelessWidget {
  final LocationModel? location;

  const SelectedLocationCard({
    super.key,
    this.location,
  });

  @override
  Widget build(BuildContext context) {
    if (location == null) {
      return Card(
        elevation: 0,
        color: Colors.grey.shade100,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Padding(
          padding: EdgeInsets.all(20),
          child: Row(
            children: [
              Icon(
                Icons.location_off,
                color: Colors.grey,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'No location selected.',
                  style: TextStyle(
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.location_on,
                  color: Theme.of(context)
                      .colorScheme
                      .primary,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Selected Location',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight:
                        FontWeight.bold,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            _buildRow(
              Icons.home,
              'Address',
              location!.address,
            ),

            _buildRow(
              Icons.location_city,
              'Locality',
              location!.locality,
            ),

            _buildRow(
              Icons.apartment,
              'City',
              location!.city,
            ),

            _buildRow(
              Icons.map,
              'State',
              location!.state,
            ),

            _buildRow(
              Icons.flag,
              'Country',
              location!.country,
            ),

            _buildRow(
              Icons.markunread_mailbox,
              'Postal Code',
              location!.postalCode,
            ),

            const Divider(height: 28),

            _buildRow(
              Icons.my_location,
              'Latitude',
              location!.latitude
                  .toStringAsFixed(6),
            ),

            _buildRow(
              Icons.explore,
              'Longitude',
              location!.longitude
                  .toStringAsFixed(6),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(
    IconData icon,
    String title,
    String value,
  ) {
    return Padding(
      padding:
          const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight:
                        FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value.isEmpty
                      ? '-'
                      : value,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}