import 'package:flutter/material.dart';

class RecentSearchWidget extends StatelessWidget {
  final List<String> recentSearches;
  final ValueChanged<String>? onSearchSelected;
  final ValueChanged<String>? onDeleteSearch;

  const RecentSearchWidget({
    super.key,
    required this.recentSearches,
    this.onSearchSelected,
    this.onDeleteSearch,
  });

  @override
  Widget build(BuildContext context) {
    if (recentSearches.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent Searches',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 14),

          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: recentSearches.map((search) {
              return InputChip(
                avatar: const Icon(Icons.history, size: 18),
                label: Text(search),
                onPressed: () {
                  onSearchSelected?.call(search);
                },
                onDeleted: () {
                  onDeleteSearch?.call(search);
                },
                deleteIcon: const Icon(Icons.close, size: 18),
                backgroundColor: Colors.grey.shade100,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
