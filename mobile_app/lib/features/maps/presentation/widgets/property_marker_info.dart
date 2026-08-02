import 'package:flutter/material.dart';

class PropertyMarkerInfo extends StatelessWidget {
  final String title;
  final String address;
  final String price;
  final String imageUrl;
  final double rating;
  final double distance;

  final VoidCallback? onViewDetails;
  final VoidCallback? onNavigate;

  const PropertyMarkerInfo({
    super.key,
    required this.title,
    required this.address,
    required this.price,
    required this.imageUrl,
    required this.rating,
    required this.distance,
    this.onViewDetails,
    this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 10,
      margin: const EdgeInsets.all(16),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: SizedBox(
        height: 140,
        child: Row(
          children: [
            SizedBox(
              width: 120,
              height: double.infinity,
              child: imageUrl.isNotEmpty
                  ? Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) {
                        return Container(
                          color: Colors.grey.shade300,
                          child: const Icon(Icons.home, size: 50),
                        );
                      },
                    )
                  : Container(
                      color: Colors.grey.shade300,
                      child: const Icon(Icons.home, size: 50),
                    ),
            ),

            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 17,
                      ),
                    ),

                    const SizedBox(height: 6),

                    Text(
                      address,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.grey.shade700),
                    ),

                    const Spacer(),

                    Row(
                      children: [
                        Icon(
                          Icons.star,
                          color: Colors.amber.shade700,
                          size: 18,
                        ),

                        const SizedBox(width: 4),

                        Text(rating.toStringAsFixed(1)),

                        const Spacer(),

                        Text(
                          '${distance.toStringAsFixed(1)} km',
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Text(
                          price,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),

                        const Spacer(),

                        IconButton(
                          tooltip: 'Navigate',
                          onPressed: onNavigate,
                          icon: const Icon(Icons.navigation),
                        ),

                        ElevatedButton(
                          onPressed: onViewDetails,
                          child: const Text('View'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
