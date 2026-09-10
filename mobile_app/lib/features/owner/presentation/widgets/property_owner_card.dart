import 'package:flutter/material.dart';

import '../../domain/entities/owner_property_entity.dart';

class PropertyOwnerCard extends StatelessWidget {
  const PropertyOwnerCard({
    super.key,
    required this.property,
    this.onTap,
    this.onEdit,
    this.onDelete,
  });

  final OwnerPropertyEntity property;

  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: property.imageUrl.trim().isEmpty
                  ? _imagePlaceholder(context)
                  : Image.network(
                      property.imageUrl,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, progress) =>
                          progress == null
                          ? child
                          : _imagePlaceholder(context, loading: true),
                      errorBuilder: (context, error, stackTrace) =>
                          _imagePlaceholder(context),
                    ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.title,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 18,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text("${property.locality}, ${property.city}"),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Text(
                        "₹${property.rent.toStringAsFixed(0)} / month",
                        style: const TextStyle(
                          color: Colors.green,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const Spacer(),

                      Chip(
                        label: Text(
                          !property.isVerified
                              ? 'Pending approval'
                              : (property.isAvailable
                                    ? 'Available'
                                    : 'Occupied'),
                        ),
                        backgroundColor: !property.isVerified
                            ? Colors.amber.shade100
                            : (property.isAvailable
                                  ? Colors.green.shade100
                                  : Colors.red.shade100),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            const Icon(Icons.visibility, size: 18),
                            const SizedBox(width: 4),
                            Text("${property.totalViews}"),
                          ],
                        ),
                      ),

                      Expanded(
                        child: Row(
                          children: [
                            const Icon(Icons.event, size: 18),
                            const SizedBox(width: 4),
                            Text("${property.pendingVisits}"),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onEdit,
                          icon: const Icon(Icons.edit),
                          label: const Text("Edit"),
                        ),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.red,
                          ),
                          onPressed: onDelete,
                          icon: const Icon(Icons.delete),
                          label: const Text("Delete"),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _imagePlaceholder(BuildContext context, {bool loading = false}) {
  return Container(
    color: Colors.grey.shade200,
    child: Center(
      child: loading
          ? const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(),
            )
          : const Icon(Icons.home_outlined, size: 60, color: Colors.grey),
    ),
  );
}
￿￿￿