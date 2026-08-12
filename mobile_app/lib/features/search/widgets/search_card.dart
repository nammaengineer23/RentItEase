import 'package:flutter/material.dart';

import '../data/models/search_model.dart';

class SearchCard extends StatelessWidget {
  const SearchCard({super.key, required this.entity});

  final SearchModel entity;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
          child: const Icon(Icons.home_work),
        ),
        title: Text(
          entity.query.isEmpty ? 'Property Search' : entity.query,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (entity.city != null) Text('City: ${entity.city}'),

            if (entity.locality != null) Text('Locality: ${entity.locality}'),

            if (entity.propertyType != null) Text(entity.propertyType!),

            if (entity.bedrooms != null) Text('${entity.bedrooms} BHK'),

            if (entity.minRent != null || entity.maxRent != null)
              Text(
                '₹${entity.minRent?.toStringAsFixed(0) ?? 0}'
                ' - '
                '₹${entity.maxRent?.toStringAsFixed(0) ?? 'Any'}',
              ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 18),
      ),
    );
  }
}
